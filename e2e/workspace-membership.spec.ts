import { expect, test, type Page } from "@playwright/test";

const invitationToken = "browser-fixture-invitation-credential";
const account = { id: "member-1", displayName: "Riley", email: "riley@example.com" };

async function mockAccount(page: Page, emailVerified = true) {
  await page.route("**/api/user", (route) => route.fulfill({ json: account }));
  await page.route("**/api/account/notifications", (route) => route.fulfill({
    json: {
      accountId: account.id,
      email: account.email,
      emailVerified,
      deliveryEnabled: true,
      preferences: { auditCompleted: true, auditFailed: true, reviewUpdates: true },
    },
  }));
}

test("captures the mailed fragment before the publisher script, verifies, and accepts", async ({ page }) => {
  const consoleMessages: string[] = [];
  page.on("console", (message) => consoleMessages.push(message.text()));
  await mockAccount(page);
  let acceptedBody: unknown;
  let acceptRequestUrl = "";
  await page.route("https://news.google.com/swg/js/v1/publisher.js", (route) => route.fulfill({
    contentType: "application/javascript",
    body: "window.publisherObservedLocation = window.location.href;",
  }));
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/workspace-invitations/accept", (route) => {
    acceptRequestUrl = route.request().url();
    acceptedBody = route.request().postDataJSON();
    return route.fulfill({ json: { data: { workspaceId: "workspace-1", role: "member" } } });
  });

  await page.goto(`/workspace-invitations/accept#token=${invitationToken}`);
  await expect(page).toHaveURL(/\/workspace-invitations\/accept$/);
  await expect(page.getByRole("heading", { name: "Accept workspace invitation" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean((window as Window & { publisherObservedLocation?: string }).publisherObservedLocation))).toBe(true);
  const securityState = await page.evaluate(() => ({
    publisherSawCleanUrl: !(window as unknown as { publisherObservedLocation: string }).publisherObservedLocation.includes("token="),
    tokenInUrl: location.href.includes("token="),
    tokenInLocalStorage: Object.values(localStorage).includes("browser-fixture-invitation-credential"),
    tokenInSessionStorage: sessionStorage.getItem("skaleagents_workspace_invitation") === "browser-fixture-invitation-credential",
    robots: document.querySelector('meta[name="robots"]')?.getAttribute("content"),
  }));
  expect(securityState).toEqual({
    publisherSawCleanUrl: true,
    tokenInUrl: false,
    tokenInLocalStorage: false,
    tokenInSessionStorage: true,
    robots: "noindex, nofollow",
  });

  await page.getByRole("button", { name: "Accept invitation" }).click();
  await expect(page.getByRole("status")).toContainText("Invitation accepted");
  expect(acceptedBody).toEqual({ token: invitationToken });
  expect(acceptRequestUrl).not.toContain("token=");
  expect(consoleMessages.join("\n")).not.toContain(invitationToken);
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("skaleagents_workspace_invitation"))).toBeNull();
});

test("keeps an invite through sign-in and resumes the exact accept route", async ({ page }) => {
  let signedIn = false;
  await page.route("**/api/user", (route) => route.fulfill(signedIn ? { json: account } : { status: 401, json: {} }));
  await page.route("**/api/account/notifications", (route) => route.fulfill({
    json: { accountId: account.id, email: account.email, emailVerified: true, deliveryEnabled: true, preferences: { auditCompleted: true, auditFailed: true, reviewUpdates: true } },
  }));
  await page.goto(`/workspace-invitations/accept#token=${invitationToken}`);
  const signInLink = page.getByRole("main").getByRole("link", { name: "Sign in with Google" });
  await expect(signInLink).toBeVisible();
  await expect(signInLink).toHaveAttribute("href", /api\/auth\/google\/redirect|\/login$/);
  const signInHref = await signInLink.getAttribute("href");
  expect(new URL(signInHref ?? "", "http://localhost").searchParams.has("returnTo")).toBe(false);
  expect(await page.evaluate(() => location.href.includes("browser-fixture-invitation-credential"))).toBe(false);

  signedIn = true;
  await page.goto("/bots");
  await expect(page).toHaveURL(/\/workspace-invitations\/accept$/);
  await expect(page.getByRole("heading", { name: "Accept workspace invitation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept invitation" })).toBeVisible();
});

test("does not submit an invitation for an unverified account", async ({ page }) => {
  await mockAccount(page, false);
  let accepts = 0;
  await page.route("**/api/workspace-invitations/accept", (route) => {
    accepts++;
    return route.fulfill({ status: 422, json: { message: "This invitation is invalid or expired." } });
  });
  await page.goto(`/workspace-invitations/accept#token=${invitationToken}`);
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Your account email is not verified");
  await expect(page.getByRole("button", { name: "Accept invitation" })).toHaveCount(0);
  expect(accepts).toBe(0);
});

for (const invalidCase of ["wrong email", "expired", "revoked"] as const) {
  test(`shows a generic result for ${invalidCase} invitation`, async ({ page }) => {
    await mockAccount(page);
    await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
    await page.route("**/api/workspace-invitations/accept", (route) => route.fulfill({
      status: 422,
      json: { message: "This invitation is invalid or expired." },
    }));
    await page.goto(`/workspace-invitations/accept#token=${invitationToken}`);
    await page.getByRole("button", { name: "Accept invitation" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("invalid, expired, revoked, already used, or belongs to a different verified email address");
    await expect(page.getByRole("main")).not.toContainText(invitationToken);
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("skaleagents_workspace_invitation"))).toBeNull();
    await expect(page).not.toHaveURL(/token=/);
  });
}

test("reports an already-active membership separately", async ({ page }) => {
  await mockAccount(page);
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/workspace-invitations/accept", (route) => route.fulfill({
    status: 409,
    json: { message: "This user is already a workspace member." },
  }));
  await page.goto(`/workspace-invitations/accept#token=${invitationToken}`);
  await page.getByRole("button", { name: "Accept invitation" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("This account already has an active membership in the workspace.");
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("skaleagents_workspace_invitation"))).toBeNull();
});

test("lists and creates only memberships and leaves personal resources unscoped", async ({ page }) => {
  await mockAccount(page);
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/workspaces", (route) => {
    if (route.request().method() === "POST") {
      expect(route.request().postDataJSON()).toEqual({ name: "Platform Team" });
      return route.fulfill({ json: { data: {
        id: "workspace-2", name: "Platform Team", createdAt: "2026-09-25T12:00:00Z", role: "owner",
      } }, status: 201 });
    }
    return route.fulfill({ json: { data: [
      { id: "workspace-1", name: "Infra", createdAt: "2026-09-24T12:00:00Z", role: "member" },
    ] } });
  });

  await page.goto("/workspaces");
  await expect(page.getByRole("heading", { name: "Workspaces", exact: true })).toBeVisible();
  await expect(page.getByText("Infra", { exact: true })).toBeVisible();
  await expect(page.getByText(/audits, schedules, or advisory requests.*remain tied to your account/)).toBeVisible();
  await expect(page.locator("select")).toHaveCount(0);
  await page.getByLabel("Workspace name").fill("Platform Team");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page.getByText("Platform Team", { exact: true })).toBeVisible();
});

test("workspace membership queries switch with the signed-in account", async ({ page }) => {
  let owner = "alice";
  await page.clock.install();
  await page.route("**/api/user", (route) => route.fulfill({ json: { id: owner, displayName: owner } }));
  await page.route("**/api/workspaces", (route) => route.fulfill({ json: { data: [
    { id: `workspace-${owner}`, name: `${owner} workspace`, createdAt: "2026-09-24T12:00:00Z", role: "member" },
  ] } }));
  await page.goto("/workspaces");
  await expect(page.getByRole("heading", { name: "alice workspace" })).toBeVisible();
  owner = "bob";
  await page.clock.fastForward(46_000);
  await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
  await expect(page.getByRole("heading", { name: "bob workspace" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "alice workspace" })).toHaveCount(0);
});

test("an unverified invitee can sign out and clear the pending invitation credential", async ({ page }) => {
  let signedIn = true;
  await mockAccount(page, false);
  await page.route("**/api/user", (route) => route.fulfill(signedIn ? { json: account } : { status: 401, json: {} }));
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/auth/logout", (route) => {
    signedIn = false;
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto(`/workspace-invitations/accept#token=${invitationToken}`);
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Your account email is not verified");
  await page.getByRole("button", { name: /, account menu$/ }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => sessionStorage.getItem("skaleagents_workspace_invitation"))).toBeNull();
});
