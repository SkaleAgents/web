import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/user", (route) => route.fulfill({ status: 401, json: {} }));
});

test("examples work with the keyboard and copy the selected prompt", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  const security = page.getByRole("radio", { name: "Security", exact: true });
  await security.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Reliability", exact: true })).toBeChecked();
  await expect(page.getByRole("region", { name: "Reliability example" })).toContainText("replicas: 1");
  await page.getByRole("button", { name: "Copy starter prompt" }).click();
  await expect(page.getByRole("status")).toContainText("Prompt copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("Review my Kubernetes deployment");

  await page.getByText("AI workloads", { exact: true }).click();
  await expect(page.getByRole("region", { name: "AI workloads example" })).toContainText("maxRetries");
  await expect(page.getByRole("status")).toBeEmpty();
  await page.getByText("Scaling & cost", { exact: true }).click();
  await expect(page.getByRole("region", { name: "Scaling & cost example" })).toContainText("cannot add a second replica");
});

test("clipboard failure reveals a selectable prompt", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async () => { throw new Error("Permission denied"); } },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Copy starter prompt" }).click();
  await expect(page.getByRole("status")).toContainText("Select and copy");
  await expect(page.getByText(/^Review my Terraform for exposed ports/)).toBeVisible();
});

test("workflow choices lead to their matching product entry points", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Find a specialist bot" })).toHaveAttribute("href", "/bots");
  await page.getByText("In your editor", { exact: true }).click();
  const editor = page.getByRole("region", { name: "In your editor", exact: true });
  await expect(editor).toContainText("review_architecture");
  await expect(editor.getByRole("link", { name: "See MCP setup" })).toHaveAttribute("href", "/settings");
  await page.getByText("In the web app", { exact: true }).click();
  const web = page.getByRole("region", { name: "In the web app", exact: true });
  await expect(web).toContainText("don't automatically track changes");
  await web.getByRole("link", { name: "Open audit jobs" }).click();
  await expect(page).toHaveURL(/\/jobs$/);
  await expect(page.getByRole("heading", { name: "Audit jobs" })).toBeVisible();
});

test("questions expand by keyboard and public content survives an API outage", async ({ page }) => {
  await page.route("**/api/user", (route) => route.abort());
  await page.goto("/");
  const question = page.locator("summary").filter({ hasText: "What does it cost?" });
  await question.scrollIntoViewIfNeeded();
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/This site does not currently publish paid plan prices/)).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/This site does not currently publish paid plan prices/)).toBeHidden();
  await expect(page.getByRole("link", { name: "Explore the directory" }).first()).toHaveAttribute("href", "/bots");
});

test("signed-in visitors retain the hero MCP shortcut", async ({ page }) => {
  await page.route("**/api/user", (route) => route.fulfill({ json: { id: "user-1", displayName: "Demo Engineer" } }));
  await page.goto("/");
  const hero = page.getByRole("region", { name: "Control plane for AI DevOps agents" });
  await expect(hero).toContainText("Welcome back, Demo Engineer");
  await expect(hero.getByRole("link", { name: "MCP config" })).toHaveAttribute("href", "/settings");
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`mobile layout fits in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(new RegExp(colorScheme));
    await page.getByText("Scaling & cost", { exact: true }).click();
    await page.getByText("In your editor", { exact: true }).click();
    await expect(page.getByRole("heading", { name: /Good questions.*Straight answers/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  });
}
