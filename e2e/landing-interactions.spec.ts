import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/user", (route) => route.fulfill({ status: 401, json: {} }));
  await page.route("https://**/*", (route) => route.abort());
});

test("customized prompts update, copy, and reset without leaving the page", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  const explorer = page.locator(".example-explorer");
  await explorer.scrollIntoViewIfNeeded();
  await expect(explorer.getByRole("radio", { name: "Security", exact: true })).toBeEnabled();
  await page.locator("summary").filter({ hasText: "Read or customize the prompt" }).click();
  await page.getByRole("textbox", { name: "What are you working on?" }).fill("A Node.js API on Kubernetes preparing for production.");
  await page.getByLabel("How should the answer look?").selectOption("Pull request checklist");
  const preview = page.locator("[data-prompt-preview]");
  await expect(preview).toContainText("Project context:\nA Node.js API on Kubernetes preparing for production.");
  await expect(preview).toContainText("Response format: Pull request checklist.");
  await expect(page.getByRole("button", { name: "Resume examples" })).toBeVisible();
  await page.getByRole("button", { name: "Copy custom prompt" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await preview.textContent());
  await page.getByRole("button", { name: "Reset prompt" }).click();
  await expect(page.getByRole("textbox", { name: "What are you working on?" })).toBeEmpty();
  await expect(preview).not.toContainText("Project context:");
  await expect(page.getByRole("button", { name: "Copy starter prompt" })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("the starting-point picker recommends the matching route and can be reset", async ({ page }) => {
  await page.goto("/");
  const picker = page.getByRole("region", { name: "Find your starting point." });
  await picker.scrollIntoViewIfNeeded();
  await expect(picker.getByRole("radio", { name: "Try a specialist", exact: true })).toBeEnabled();
  const choices = [
    ["Try a specialist", "Find a specialist bot", "/bots"],
    ["Try a specialist", "Grab a ready-made prompt", "/prompts"],
    ["Review infrastructure", "Inside my editor", "/mcp-config"],
    ["Review infrastructure", "In a shared web review", "/dashboard/jobs"],
    ["Review infrastructure", "On a recurring schedule", "/dashboard/schedules"],
    ["Build my own bot", "Keep it private", "/dashboard/studio"],
    ["Build my own bot", "Share it publicly", "/dashboard/studio"],
  ];
  for (const [goal, preference, href] of choices) {
    await picker.getByText(goal, { exact: true }).click();
    await picker.getByText(preference, { exact: true }).click();
    await expect(picker.getByRole("link")).toHaveAttribute("href", href);
  }
  await expect(picker).toContainText("Sign in to create and publish a bot");
  await picker.getByRole("button", { name: "Start over" }).click();
  await expect(picker.getByRole("link")).toHaveCount(0);
  await expect(picker.getByRole("radio", { name: "Try a specialist" })).toBeFocused();
});

test("the prompt builder and recommendation fit on a narrow mobile screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const explorer = page.locator(".example-explorer");
  await explorer.scrollIntoViewIfNeeded();
  await expect(explorer.getByRole("radio", { name: "Security", exact: true })).toBeEnabled();
  await page.locator("summary").filter({ hasText: "Read or customize the prompt" }).click();
  await page.getByRole("textbox", { name: "What are you working on?" }).fill("LongProjectName".repeat(20));
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  const picker = page.getByRole("region", { name: "Find your starting point." });
  await picker.scrollIntoViewIfNeeded();
  await expect(picker.getByRole("radio", { name: "Try a specialist", exact: true })).toBeEnabled();
  await picker.getByText("Review infrastructure", { exact: true }).click();
  await picker.getByText("On a recurring schedule", { exact: true }).click();
  await expect(picker.getByRole("link", { name: "Explore scheduled audits" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});
