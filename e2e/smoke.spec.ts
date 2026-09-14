import { test, expect } from "@playwright/test";

test.describe("Phase 1 page smokes", () => {
  test("login page shows Google sign-in", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /Sign in to your control plane/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Continue with Google/i }),
    ).toBeVisible();
  });

  test("directory page renders shell", async ({ page }) => {
    await page.goto("/bots");
    await expect(
      page.getByRole("heading", { name: /Bot directory/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Sign in to create/i }),
    ).toBeVisible();
    await expect(page.getByText("Deferred", { exact: true })).not.toBeVisible();
  });

  test("prompts page is readable without auth", async ({ page }) => {
    await page.goto("/prompts");
    await expect(
      page.getByRole("heading", { name: /Prompt library/i }),
    ).toBeVisible();
    await expect(page.getByText(/Sign in/i).first()).toBeVisible();
  });

  test("marketing landing shows Signal Deck brand hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("SkaleAgents").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Control plane for AI DevOps agents/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Sign in" }),
    ).toBeVisible();
    await expect(page.getByRole("contentinfo")).toContainText("SkaleAgents");
  });

  test("settings page explains the MCP connection", async ({ page }) => {
    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { name: /Connect MCP/i }),
    ).toBeVisible();
    await expect(page.getByText(/Sign in to connect/i)).toBeVisible();
  });

  test("audit page explains the signed-in workflow", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: /Audit jobs/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Start an IaC audit/i })).toBeVisible();
  });

  test("schedule page explains recurring audits", async ({ page }) => {
    await page.goto("/schedules");
    await expect(page.getByRole("heading", { name: /Scheduled audits/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Create a schedule/i })).toBeVisible();
  });

  test("every public route uses the shared menu and sign-in action", async ({ page }) => {
    for (const path of ["/", "/login", "/bots", "/jobs", "/schedules", "/studio", "/prompts", "/settings"]) {
      await page.goto(path);
      await expect(page.getByRole("navigation")).toBeVisible();
      await expect(page.getByRole("navigation").getByRole("link")).toHaveCount(7);
      await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toBeVisible();
    }
  });
});
