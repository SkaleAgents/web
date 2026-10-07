import { test, expect } from "./fixtures";

test("free resources and blog pages link through and open a prompt menu", async ({ page }) => {
  await page.goto("/resources");
  await expect(page.getByRole("heading", { name: "Checklists you can run tonight." })).toBeVisible();
  await page.getByRole("link", { name: "Public exposure review" }).click();
  await expect(page).toHaveURL(/\/resources\/public-exposure-review$/);
  await expect(page.getByRole("heading", { name: "Checklist" })).toBeVisible();
  await page.getByRole("button", { name: "Actions" }).click();
  const menu = page.getByRole("menu");
  await expect(menu.getByRole("menuitem", { name: "Open in Claude" })).toHaveAttribute("href", /claude\.ai\/new\?q=/);
  await expect(menu.getByRole("menuitem", { name: "Open in ChatGPT" })).toHaveAttribute("href", /chatgpt\.com\/\?q=/);
  await expect(menu.getByRole("menuitem", { name: "Copy as markdown" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Copy for an agent" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.goto("/blog");
  await expect(page.getByRole("heading", { name: "Notes from the review desk." })).toBeVisible();
  await expect(page.getByRole("link", { name: "The Docker socket is root on the host" })).toBeVisible();
  await page.getByRole("link", { name: "Review Terraform before you merge" }).click();
  await expect(page).toHaveURL(/\/blog\/review-terraform-before-you-merge$/);
  await page.getByRole("link", { name: "Wildcard IAM review" }).click();
  await expect(page).toHaveURL(/\/resources\/wildcard-iam-review$/);
});
