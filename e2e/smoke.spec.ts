import { test, expect } from "@playwright/test";

test.describe("Phase 1 page smokes", () => {
  test("login page shows mock Grok sign-in", async ({ page }) => {
    await page.goto("/app/login");
    await expect(
      page.getByRole("heading", { name: /Sign in with Grok Bot/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Mock code")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
  });

  test("directory page renders shell", async ({ page }) => {
    await page.goto("/app/bots");
    await expect(
      page.getByRole("heading", { name: /Bot directory/i }),
    ).toBeVisible();
  });

  test("prompts page is readable without auth", async ({ page }) => {
    await page.goto("/app/prompts");
    await expect(
      page.getByRole("heading", { name: /Prompt library/i }),
    ).toBeVisible();
    await expect(page.getByText(/Sign in/i).first()).toBeVisible();
  });

  test("marketing surface responds", async ({ page }) => {
    await page.goto("/marketing");
    await expect(page.locator("body")).toBeVisible();
  });
});
