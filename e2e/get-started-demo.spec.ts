import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/user", (route) => route.fulfill({ status: 401, json: {} }));
  await page.route("https://**/*", (route) => route.abort());
});

test("Get started stays on the page and restores focus when dismissed", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("region", { name: "Control plane for AI DevOps agents" }).getByRole("button", { name: "Get started" });
  await trigger.click();
  const panel = page.getByRole("dialog", { name: "Choose how to get started." });
  await expect(panel).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await expect(panel.getByRole("link", { name: "Set up MCP" })).toHaveAttribute("href", "/settings/mcp");
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.mouse.click(2, 2);
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the hero panel opens the editable demo without sign-in", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await page.getByRole("region", { name: "Control plane for AI DevOps agents" }).getByRole("button", { name: "Get started" }).click();
  const panel = page.getByRole("dialog", { name: "Choose how to get started." });
  await expect(panel).toBeVisible();
  await panel.getByRole("link", { name: "Try the editable demo" }).click();
  await expect(panel).toBeHidden();
  await expect(page).toHaveURL(/\/#sample-demo$/);
  await expect(page.getByRole("textbox", { name: "Sample deployment settings (JSON)" })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test("sample findings respond to edits, reject invalid settings, and reset", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#sample-demo");
  const editor = page.getByRole("textbox", { name: "Sample deployment settings (JSON)" });
  await expect(page.getByRole("heading", { name: "0 of 3 sample checks configured" })).toBeVisible();
  await editor.fill('{"replicas":3,"readinessProbe":false,"memoryLimitMi":256}');
  await expect(page.getByRole("heading", { name: "2 of 3 sample checks configured" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "3 replicas configured" })).toBeVisible();
  await editor.fill('{"replicas":3,"readinessProbe":"false","memoryLimitMi":256}');
  await expect(editor).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Set readinessProbe to true or false, without quotation marks.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy demo settings" })).toBeDisabled();
  await page.getByRole("button", { name: "Apply example improvements" }).click();
  await expect(page.getByRole("heading", { name: "3 of 3 sample checks configured" })).toBeVisible();
  await page.getByRole("button", { name: "Copy demo settings" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await editor.inputValue());
  await page.getByRole("button", { name: "Reset sample" }).click();
  await expect(page.getByRole("heading", { name: "0 of 3 sample checks configured" })).toBeVisible();
});

test("Google authentication starts from the explicit header sign-in action", async ({ page }) => {
  let authRequests = 0;
  await page.route("**/api/auth/google/redirect", (route) => {
    authRequests++;
    return route.fulfill({ contentType: "text/html", body: "Google sign-in handoff" });
  });
  await page.goto("/");
  expect(authRequests).toBe(0);
  await page.getByRole("banner").getByRole("link", { name: "Sign in with Google" }).click();
  await expect(page.getByText("Google sign-in handoff")).toBeVisible();
  expect(authRequests).toBe(1);
});
