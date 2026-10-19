import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/account/passkeys", route => route.fulfill({ json: { accountId: "alice", passkeys: [] } }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: { accountId: "alice", enabled: false } }));
});

function settings(owner = "alice") {
  return {
    accountId: owner,
    email: `${owner}@example.com`,
    emailVerified: true,
    deliveryEnabled: true,
    preferences: { auditCompleted: true, auditFailed: true },
  };
}

test("email preferences save independently and survive reload", async ({ page }) => {
  const saved = settings();
  await page.route("**/api/user", (route) => route.fulfill({ json: { id: "alice", displayName: "Alice" } }));
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/account/notifications", (route) => {
    if (route.request().method() === "PATCH") {
      const { accountId, ...changes } = route.request().postDataJSON();
      expect(accountId).toBe("alice");
      Object.assign(saved.preferences, changes);
    }
    return route.fulfill({ json: saved });
  });
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/account\/notifications$/);
  await expect(page.getByRole("heading", { name: "Notifications", exact: true })).toBeVisible();
  await expect(page.getByText("alice@example.com", { exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /^Completed audits/ })).toBeChecked();
  await page.getByRole("checkbox", { name: /^Completed audits/ }).click();
  await expect(page.getByText("Preferences saved.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /^Completed audits/ })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: /^Failed audits/ })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: /^Review updates/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Manage optional schedule webhooks" })).toHaveAttribute("href", "/me/schedules");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("load and save errors are recoverable without pretending preferences changed", async ({ page }) => {
  let loadFails = true;
  let saveFails = true;
  const saved = settings();
  await page.route("**/api/user", (route) => route.fulfill({ json: { id: "alice", displayName: "Alice" } }));
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/account/notifications", (route) => {
    if (route.request().method() === "PATCH") {
      if (saveFails) return route.fulfill({ status: 503, json: { message: "Saving unavailable" } });
      saved.preferences.auditFailed = false;
    } else if (loadFails) {
      return route.fulfill({ status: 503, json: { message: "Preferences unavailable" } });
    }
    return route.fulfill({ json: saved });
  });
  await page.goto("/settings");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Preferences unavailable");
  loadFails = false;
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await page.getByRole("checkbox", { name: /^Failed audits/ }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Could not save preferences");
  await expect(page.getByRole("checkbox", { name: /^Failed audits/ })).toBeChecked();
  saveFails = false;
  await page.getByRole("checkbox", { name: /^Failed audits/ }).click();
  await expect(page.getByRole("checkbox", { name: /^Failed audits/ })).not.toBeChecked();
});

test("disabled delivery is explicit while preferences remain editable", async ({ page }) => {
  await page.route("**/api/user", (route) => route.fulfill({ json: { id: "alice", displayName: "Alice" } }));
  await page.route("**/api/account/notifications", (route) => route.fulfill({ json: { ...settings(), deliveryEnabled: false, emailVerified: false } }));
  await page.goto("/settings");
  await expect(page.getByText(/messages are not being sent yet/)).toBeVisible();
  await expect(page.getByText(/Your email must be verified/)).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /^Completed audits/ })).toBeEnabled();
});

test("guests reach the sign-in form and make no private preference requests", async ({ page }) => {
  let privateRequests = 0;
  await page.route("**/api/user", (route) => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/account/notifications", (route) => {
    privateRequests++;
    return route.fulfill({ status: 401, json: {} });
  });
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fsettings$/);
  await expect(page.getByRole("link", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  expect(privateRequests).toBe(0);
});

test("account changes discard the previous email address and preferences", async ({ page }) => {
  let owner = "alice";
  await page.route("**/api/account/retention", route => route.fulfill({ json: { accountId: owner, enabled: false } }));
  await page.clock.install();
  await page.route("**/api/user", (route) => route.fulfill({ json: { id: owner, displayName: owner } }));
  await page.route("**/api/account/notifications", (route) => route.fulfill({ json: {
    ...settings(owner), preferences: { auditCompleted: owner === "bob", auditFailed: true },
  } }));
  await page.goto("/settings");
  await expect(page.getByText("alice@example.com", { exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /^Completed audits/ })).not.toBeChecked();
  owner = "bob";
  await page.clock.fastForward(46_000);
  await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
  await expect(page.getByText("bob@example.com", { exact: true })).toBeVisible();
  await expect(page.getByText("alice@example.com", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: /^Completed audits/ })).toBeChecked();
});

test("late preference saves cannot restore private data after logout", async ({ page }) => {
  let signedIn = true;
  let saving = false;
  let release!: () => void;
  const delayed = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/user", (route) => route.fulfill(signedIn ? { json: { id: "alice", displayName: "Alice" } } : { status: 401, json: {} }));
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/auth/logout", (route) => {
    signedIn = false;
    return route.fulfill({ json: { ok: true } });
  });
  await page.route("**/api/account/notifications", async (route) => {
    if (route.request().method() === "PATCH") {
      saving = true;
      await delayed;
    }
    await route.fulfill({ json: settings() }).catch(() => {});
  });
  await page.goto("/settings");
  await page.getByRole("checkbox", { name: /^Completed audits/ }).click();
  await expect.poll(() => saving).toBe(true);
  await page.getByRole("button", { name: "Alice, account menu" }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login(?:\?next=.*)?$/);
  release();
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fsettings$/);
  await expect(page.getByText("alice@example.com", { exact: true })).toHaveCount(0);
});
