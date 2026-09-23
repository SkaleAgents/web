import { test, expect } from "@playwright/test";

test("hosted MCP exposes OAuth discovery and challenges unauthenticated requests", async ({ request }) => {
  const response = await request.post("/mcp", { data: { jsonrpc: "2.0", id: 1, method: "tools/list" } });
  expect(response.status()).toBe(401);
  expect(response.headers()["www-authenticate"]).toContain('resource_metadata="https://skaleagents.com/.well-known/oauth-protected-resource/mcp"');
  for (const path of ["/.well-known/oauth-protected-resource", "/.well-known/oauth-protected-resource/mcp"]) {
    const metadata = await request.get(path);
    expect(metadata.ok()).toBe(true);
    expect(await metadata.json()).toMatchObject({ resource: "https://skaleagents.com/mcp", authorization_servers: ["https://api.skaleagents.com"], scopes_supported: ["mcp"] });
  }
  const preflight = await request.fetch("/mcp", { method: "OPTIONS", headers: { Origin: "https://claude.ai" } });
  expect(preflight.status()).toBe(204);
});

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
  await page.route("**/api/oauth/connections", (route) => route.fulfill({ json: { connections: connected ? [{ id: "1", clientId: "mcp_registered_client", clientName: "Claude Desktop", createdAt: "2026-09-23T00:00:00Z", lastUsedAt: null, expiresAt: "2026-10-23T00:00:00Z" }] : [] } }));
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
  expect(config.mcpServers.skaleagents).toEqual({ url: "https://skaleagents.com/mcp" });
  await expect(page.locator("p").filter({ hasText: /^Claude Desktop$/ })).toBeVisible();
  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(page.getByText(/No clients connected yet/)).toBeVisible();
  expect(manualKeyRequests).toBe(0);
});

test("client setup offers URL-only connectors and client-specific editor configuration", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/settings");
  const choices = page.getByRole("group", { name: "Choose your MCP client" });
  await expect(choices.getByRole("button")).toHaveText(["Cursor", "Claude Code", "Claude Desktop", "ChatGPT", "Codex"]);
  for (const client of ["Claude Desktop", "ChatGPT"]) {
    await choices.getByRole("button", { name: client, exact: true }).click();
    await expect(choices.getByRole("button", { name: client, exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Copy server URL", exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("https://skaleagents.com/mcp");
    await expect(page.locator("#mcp-client-setup")).toContainText("OAuth client fields blank");
  }
  await choices.getByRole("button", { name: "Codex", exact: true }).click();
  await page.getByRole("button", { name: "Copy Codex config" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('[mcp_servers.skaleagents]\nurl = "https://skaleagents.com/mcp"');
  await expect(page.getByText("codex mcp login skaleagents", { exact: true }).first()).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(choices.getByRole("button", { name: "ChatGPT", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
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
