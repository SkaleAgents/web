import { expect, test } from "./fixtures";

const user = { id: "owner", displayName: "Test Owner", email: "old@example.com" };

test("change email sends a link to the new address, and the link finishes the change", async ({ page }) => {
  let current = user;
  let requested: Record<string, string> = {};
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/user", route => route.fulfill({ json: current }));
  await page.route("**/api/account/email", route => { requested = route.request().postDataJSON(); return route.fulfill({ status: 202, json: { ok: true, email: "new@example.com" } }); });
  await page.route("**/api/account/email/confirm", route => { current = { ...user, email: "new@example.com" }; return route.fulfill({ json: current }); });

  await page.goto("/account/profile");
  await page.getByRole("button", { name: "Change email" }).click();
  await page.getByLabel("New email").fill("new@example.com");
  await page.getByRole("button", { name: "Send confirmation link" }).click();
  await expect(page.getByRole("status").filter({ hasText: "We sent a link to" })).toContainText("new@example.com");
  expect(requested).toEqual({ accountId: "owner", email: "new@example.com" });
  await expect(page.locator("main").getByText("old@example.com", { exact: true })).toBeVisible();

  await page.goto(`/account/email/confirm#token=${"t".repeat(64)}`);
  await expect(page.getByText(/Your email is now/)).toContainText("new@example.com");
  await expect(page).toHaveURL("/account/email/confirm");
  await page.getByRole("link", { name: "Back to your profile" }).click();
  await expect(page.locator("main").getByText("new@example.com", { exact: true })).toBeVisible();
});
