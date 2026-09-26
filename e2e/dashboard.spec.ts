import { expect, test, type Page } from "@playwright/test";

const owner = { id: "dashboard-owner", displayName: "Dashboard Owner", email: "owner@example.com" };

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
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Account overview" }).getByRole("link", { name: /^Audit jobs/ })).toContainText("1");
  await expect(page.getByRole("link", { name: "Review complete" })).toBeVisible();
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const nav = page.getByRole("navigation", { name: "Dashboard navigation" });
    if (width < 1024) await nav.getByRole("button", { name: "Open menu" }).click();
    await expect(nav.getByRole("link", { name: "Settings", exact: true })).toHaveAttribute("href", "/dashboard/settings");
    await expect(nav.getByRole("link", { name: "Overview", exact: true })).toHaveAttribute("aria-current", "page");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width < 1024) await nav.getByRole("button", { name: "Close menu" }).click();
  }
});

test("guests cannot mount management pages or request private data", async ({ page }) => {
  let privateRequests = 0;
  await page.route("http://localhost:8082/api/**", route => { privateRequests++; return route.fulfill({ status: 401, json: {} }); });
  await page.route("**/api/user", route => route.fulfill({ status: 401, json: {} }));
  for (const path of ["/dashboard", "/dashboard/jobs", "/dashboard/studio", "/dashboard/prompts", "/dashboard/bots", "/dashboard/settings", "/dashboard/mcp-config", "/dashboard/workspaces"]) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path)}$`));
    await expect(page.getByRole("navigation", { name: "Dashboard navigation" })).toHaveCount(0);
  }
  expect(privateRequests).toBe(0);
});

test("public catalogs omit credentials and hide private resources even for a signed-in visitor", async ({ page, context }) => {
  await context.addCookies([{ name: "session", value: "test-session", domain: "localhost", path: "/" }]);
  await page.route("**/api/user", route => route.fulfill({ json: owner }));
  let publicRequests = 0;
  await page.route("**/api/bots", async route => {
    expect(await route.request().headerValue("cookie")).toBeNull();
    expect(await route.request().headerValue("x-xsrf-token")).toBeNull();
    publicRequests++;
    return route.fulfill({ json: { bots: [
      { id: "public", name: "Public reviewer", visibility: "public", status: "published", specialty: "sre", description: "Public instructions" },
      { id: "private", name: "Private draft", ownerUserId: owner.id, visibility: "private", status: "draft", specialty: "sre", description: "Secret" },
    ] } });
  });
  await page.route("**/api/prompts", async route => {
    expect(await route.request().headerValue("cookie")).toBeNull();
    publicRequests++;
    return route.fulfill({ json: { prompts: [
      { id: "public", title: "Community prompt", body: "Public", tags: [], ownerUserId: null },
      { id: "private", title: "Private prompt", body: "Secret", tags: [], ownerUserId: owner.id },
    ] } });
  });
  await page.goto("/bots");
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
  await expect(page.getByRole("link", { name: "Open MCP connections" })).toHaveAttribute("href", "/dashboard/mcp-config");
  expect(connections).toBe(0);
  expect(publicRequests).toBe(2);
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
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  failed = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
});

test("login accepts dashboard destinations and rejects external redirects", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: owner }));
  await overview(page);
  await page.goto("/login?next=%2Fdashboard%2Fstudio");
  await expect(page).toHaveURL(/\/dashboard\/studio$/);
  await page.goto("/login?next=https%3A%2F%2Fevil.example%2Fdashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/auth/reauth?next=%2Fdashboard%2Fsettings");
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/reauth\?next=/);
});
