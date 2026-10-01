import { expect, test } from "@playwright/test";

test("public pages ask for cookie consent until the visitor chooses", async ({ page }) => {
  await page.goto("/");
  const notice = page.getByRole("region", { name: "Cookie consent" });
  await expect(notice).toBeVisible();
  await expect(notice.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy#cookies");

  await notice.getByRole("button", { name: "Necessary only" }).click();
  await expect(notice).toHaveCount(0);

  await page.goto("/privacy#cookies");
  await expect(page.getByRole("heading", { name: "Cookies" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Cookie consent" })).toHaveCount(0);
});

test("the dashboard uses the same cookie consent notice", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("region", { name: "Cookie consent" })).toBeVisible();
  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByRole("region", { name: "Cookie consent" })).toHaveCount(0);
  const cookies = await page.context().cookies();
  expect(cookies.some(cookie => cookie.name === "skale_cookie_consent" && cookie.value === "accepted")).toBe(true);
});
