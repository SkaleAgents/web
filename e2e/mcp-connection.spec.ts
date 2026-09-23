import { test, expect } from "@playwright/test";

test("MCP configuration needs no manual key and connected clients can be disconnected", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.route("**/api/user", (route) => route.fulfill({ json: { id: "owner", displayName: "MCP Owner" } }));
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  let connected = true;
  let manualKeyRequests = 0;
  await page.route("**/api/tokens", (route) => {
    manualKeyRequests++;
    return route.fulfill({ status: 500 });
  });
  await page.route("**/api/oauth/connections", (route) => route.fulfill({ json: { connections: connected ? [{ id: "1", clientId: "skaleagents-mcp", createdAt: "2026-09-23T00:00:00Z", lastUsedAt: null, expiresAt: "2026-10-23T00:00:00Z" }] : [] } }));
  await page.route("**/api/oauth/connections/1", (route) => {
    expect(route.request().method()).toBe("DELETE");
    connected = false;
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Connect MCP", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create token" })).toHaveCount(0);
  await page.getByRole("button", { name: "Copy MCP config" }).click();
  const config = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
  expect(config.mcpServers.skaleagents.args).toEqual(["-y", "@skaleagents/swarm@0.3.0"]);
  expect(config.mcpServers.skaleagents.env.PLATFORM_API_URL).toMatch(/^https?:\/\//);
  expect(config.mcpServers.skaleagents.env).not.toHaveProperty("SKALEAGENTS_API_TOKEN");
  await expect(page.getByText("SkaleAgents MCP", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(page.getByText(/No clients connected yet/)).toBeVisible();
  expect(manualKeyRequests).toBe(0);
});

test("Google sign-in appears only in the header on product pages and MCP is prominent on home", async ({ page }) => {
  await page.route("**/api/user", (route) => route.fulfill({ status: 401, json: {} }));
  for (const path of ["/", "/bots", "/prompts", "/jobs", "/schedules", "/studio", "/settings", "/login", "/login?oauth=1"]) {
    await page.goto(path);
    const signIn = page.getByRole("link", { name: "Sign in with Google", exact: true });
    await expect(signIn).toHaveCount(1);
    await expect(page.getByRole("banner").getByRole("link", { name: "Sign in with Google" })).toBeVisible();
    await expect(signIn.locator("svg")).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: /Sign in|Continue with Google/ })).toHaveCount(0);
    await expect(page.getByRole("main").getByRole("button", { name: /Sign in|Continue with Google/ })).toHaveCount(0);
  }
  await page.goto("/");
  const section = page.getByRole("region", { name: "Your editor is the starting point." });
  await expect(section).toContainText("Connect through Google OAuth");
  await section.getByRole("link", { name: "Set up your MCP connection" }).click();
  await expect(page).toHaveURL(/\/settings$/);
});
