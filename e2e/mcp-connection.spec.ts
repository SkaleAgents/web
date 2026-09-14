import { test, expect } from "@playwright/test";

test("a signed-in user gets a copy-ready MCP connection config", async ({ page }) => {
  const user = {
    id: "00000000-0000-4000-8000-000000000031",
    displayName: "MCP Owner",
    email: "mcp@example.com",
    grokLinked: false,
  };
  const token = "skaleagents-test-mcp-token";
  let copiedConfig = "";

  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copiedConfig?: string }).copiedConfig = text;
        },
      },
    });
  });
  await page.route("**/api/user", (route) => route.fulfill({ json: user }));
  await page.route("**/sanctum/csrf-cookie", (route) =>
    route.fulfill({ status: 204 }),
  );
  await page.route("**/api/tokens", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        json: {
          token,
          apiToken: {
            id: "00000000-0000-4000-8000-000000000032",
            name: "Cursor MCP",
            lastUsedAt: null,
            createdAt: new Date().toISOString(),
          },
        },
      });
      return;
    }

    await route.fulfill({ json: { tokens: [] } });
  });

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Connect MCP" })).toBeVisible();
  await expect(page.getByText("review_architecture", { exact: true })).toBeVisible();
  await expect(page.locator("pre").first()).toContainText("<paste-token-here>");

  await page.getByRole("button", { name: "Create token" }).click();
  await expect(page.getByText(token, { exact: true })).toBeVisible();
  await expect(page.locator("pre").first()).toContainText(token);

  await page.getByRole("button", { name: "Copy MCP config" }).click();
  copiedConfig = await page.evaluate(
    () => (window as unknown as { copiedConfig?: string }).copiedConfig ?? "",
  );
  expect(copiedConfig).toContain('"@skaleagents/swarm"');
  expect(copiedConfig).toContain(token);
  expect(copiedConfig).toContain('"PLATFORM_API_URL"');
});
