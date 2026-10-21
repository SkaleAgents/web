import { expect, test, type Page } from "./fixtures";

const owner = { id: "dashboard-owner", displayName: "Dashboard Owner", email: "owner@example.com" };
const personalId = "0198f0b0-0000-7000-8000-000000000001";
const personal = { id: personalId, name: "Personal", kind: "personal", role: "owner" };

test.beforeEach(async ({ page }) => {
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: [personal] } }));
  await page.route(`**/api/workspaces/${personalId}`, route => route.fulfill({ json: { data: personal } }));
});

async function overview(page: Page) {
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: [{ id: "job-1", summary: "Review complete", status: "completed", createdAt: "2026-09-26T00:00:00Z" }] } }));
  await page.route("**/api/schedules", route => route.fulfill({ json: { schedules: [] } }));
  await page.route("**/api/bots", route => route.fulfill({ json: { bots: [] } }));
}

test("login waits for the session, then opens the dashboard without showing the form", async ({ page }) => {
  let release!: () => void;
  const waiting = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/user", async route => { await waiting; await route.fulfill({ json: owner }); });
  await overview(page);
  await page.goto("/login");
  await expect(page.getByRole("status")).toHaveText("Checking your session…");
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  release();
  await expect(page).toHaveURL(`/org/${personalId}`);
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Account overview" }).getByRole("link", { name: /^Audit jobs/ })).toContainText("1");
  await expect(page.getByRole("link", { name: "Review complete" })).toBeVisible();
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const nav = page.getByRole("navigation", { name: "Dashboard navigation" });
    if (width < 1024) await page.getByRole("button", { name: "Open menu" }).click();
    if (await nav.getByRole("button", { name: "Account", exact: true }).getAttribute("aria-expanded") === "false") await nav.getByRole("button", { name: "Account", exact: true }).click();
    await expect(nav.getByRole("link", { name: "Passkeys", exact: true })).toHaveAttribute("href", "/account/passkeys");
    await expect(nav.getByRole("link", { name: "Dashboard", exact: true })).toHaveAttribute("aria-current", "page");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width < 1024) await page.getByRole("button", { name: "Close menu" }).click();
  }
});

test("guests cannot mount management pages or request private data", async ({ page }) => {
  let privateRequests = 0;
  await page.route("http://localhost:8082/api/**", route => { privateRequests++; return route.fulfill({ status: 401, json: {} }); });
  await page.route("**/api/user", route => route.fulfill({ status: 401, json: {} }));
  for (const path of ["/me", "/me/jobs", "/me/studio", "/me/prompts", "/me/bots", "/me/settings", "/me/mcp-config", "/organizations"]) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path)}$`));
    await expect(page.getByRole("navigation", { name: "Dashboard navigation" })).toHaveCount(0);
  }
  expect(privateRequests).toBe(0);
});

test("public catalogs omit credentials and hide private resources even for a signed-in visitor", async ({ page, context }) => {
  await context.addCookies([{ name: "session", value: "test-session", domain: "localhost", path: "/" }]);
  await page.route("**/api/user", route => route.fulfill({ json: owner }));
  const publicRequests = new Set<string>();
  await page.route("**/api/bots", async route => {
    expect(await route.request().headerValue("cookie")).toBeNull();
    expect(await route.request().headerValue("x-xsrf-token")).toBeNull();
    publicRequests.add(new URL(route.request().url()).pathname);
    return route.fulfill({ json: { bots: [
      { id: "public", name: "Public reviewer", visibility: "public", status: "published", specialty: "sre", description: "Public instructions" },
      { id: "private", name: "Private draft", ownerUserId: owner.id, visibility: "private", status: "draft", specialty: "sre", description: "Secret" },
    ] } });
  });
  await page.route("**/api/prompts", async route => {
    expect(await route.request().headerValue("cookie")).toBeNull();
    publicRequests.add(new URL(route.request().url()).pathname);
    return route.fulfill({ json: { prompts: [
      { id: "public", title: "Community prompt", body: "Public", tags: [], ownerUserId: null },
      { id: "private", title: "Private prompt", body: "Secret", tags: [], ownerUserId: owner.id },
    ] } });
  });
  await page.goto("/bot-directory");
  await expect(page.getByRole("link", { name: "Public reviewer" })).toBeVisible();
  await expect(page.getByText("Private draft")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Edit in Studio" })).toHaveCount(0);
  await page.goto("/prompts");
  await expect(page.getByRole("heading", { name: "Community prompt" })).toBeVisible();
  await expect(page.getByText("Private prompt")).toHaveCount(0);
  await expect(page.getByText("Save your own prompt")).toHaveCount(0);
  let connections = 0;
  await page.route("**/api/oauth/connections", route => { connections++; return route.fulfill({ json: { connections: [] } }); });
  await page.goto("/mcp-config");
  await expect(page.getByRole("link", { name: "Open MCP connections" })).toHaveAttribute("href", "/me/mcp-config");
  expect(connections).toBe(0);
  expect([...publicRequests].sort()).toEqual(["/api/bots", "/api/prompts"]);
});

test("signed-in OAuth login resumes consent instead of opening the dashboard", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: owner }));
  await page.route("**/oauth/authorize", route => route.fulfill({ contentType: "text/html", body: "<h1>Approve MCP access</h1>" }));
  await page.goto("/login?oauth=1");
  await expect(page).toHaveURL(/\/oauth\/authorize$/);
  await expect(page.getByRole("heading", { name: "Approve MCP access" })).toBeVisible();
});

test("login recovers from a session error without showing a misleading sign-in form", async ({ page }) => {
  let failed = true;
  await page.route("**/api/user", route => route.fulfill(failed ? { status: 503, json: {} } : { status: 401, json: {} }));
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Could not check your session" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue with Google" })).toHaveCount(0);
  failed = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("link", { name: "Continue with Google" })).toBeVisible();
});

test("login accepts dashboard destinations and rejects external redirects", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: owner }));
  await overview(page);
  await page.goto("/login?next=%2Fdashboard%2Fstudio");
  await expect(page).toHaveURL(`/org/${personalId}/studio`);
  await page.goto("/login?next=https%3A%2F%2Fevil.example%2Fdashboard");
  await expect(page).toHaveURL(`/org/${personalId}`);
  await page.goto("/auth/reauth?next=%2Fdashboard%2Fsettings");
  await expect(page.getByRole("link", { name: "Continue with Google" })).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/reauth\?next=/);
});

test("dashboard has its own navigation and keeps the public shell on public pages", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: owner }));
  await overview(page);
  await page.goto("/me");
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page.getByRole("contentinfo")).toContainText("Binary Labs LLC");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Terms", exact: true })).toHaveAttribute("href", "/terms");
  await expect(page.getByRole("button", { name: "Dashboard Owner, account menu" })).toBeVisible();
  const sidebar = page.getByRole("navigation", { name: "Dashboard navigation" });
  const before = await sidebar.boundingBox();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect((await sidebar.boundingBox())!.y).toBe(before!.y);
  const publicLink = sidebar.getByRole("link", { name: "Visit public site (opens in a new tab)", exact: true });
  await expect(publicLink).toHaveAttribute("target", "_blank");
  await expect(publicLink).toContainText("↗");
  const popupPromise = page.waitForEvent("popup");
  await publicLink.click();
  const publicPage = await popupPromise;
  await expect(publicPage).toHaveURL(/\/$/);
  await expect(publicPage.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await expect(publicPage.getByRole("contentinfo")).toBeVisible();
  await expect(page).toHaveURL(/\/org\/[^/]+$/);
  await expect(sidebar).toBeVisible();
  await publicPage.close();
});

test("sign-in is a focused entry point with a way back to the public site", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ status: 401, json: {} }));
  await page.goto("/login");
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByRole("banner")).toHaveCount(0);
  const footer = page.getByRole("contentinfo", { name: "Account page links" });
  await expect(footer.getByRole("link", { name: "Browse the directory" })).toHaveAttribute("href", "/bot-directory");
  await footer.getByRole("link", { name: "Back to public site" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
});

test("mobile dashboard menu closes on Escape and after navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/user", route => route.fulfill({ json: owner }));
  await overview(page);
  await page.goto("/me");
  const nav = page.getByRole("navigation", { name: "Dashboard navigation" });
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(nav.getByRole("button", { name: "Your work", exact: true })).toBeFocused();
  await nav.getByRole("button", { name: "Build" }).click();
  await nav.getByRole("link", { name: "My bots", exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  await expect(nav.getByRole("link", { name: "My bots", exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Open menu" }).click();
  await nav.getByRole("link", { name: "My bots", exact: true }).click();
  await expect(page).toHaveURL(`/org/${personalId}/bots`);
  await expect(page.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(nav.getByRole("link", { name: "My bots", exact: true })).toHaveAttribute("aria-current", "page");
});

test("the organization dashboard offers a passkey after an emailed sign-in link until Not now", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: owner }));
  await page.route("**/api/account/passkeys", route => route.fulfill({ json: { accountId: owner.id, passkeys: [] } }));
  await overview(page);
  await page.addInitScript(() => { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); sessionStorage.setItem("skale:offer-passkey", "1"); } });
  await page.goto(`/org/${personalId}`);
  await expect(page.getByRole("heading", { name: "Add a passkey (highly recommended)" })).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(page.getByRole("heading", { name: "Add a passkey (highly recommended)" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Add a passkey (highly recommended)" })).toHaveCount(0);
});
