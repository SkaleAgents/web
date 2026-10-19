import { expect, test } from "./fixtures";

const user = { id: "alice", displayName: "Alice", email: "alice@example.com" };

test("delete account needs the typed email, lists blockers, then signs out", async ({ page }) => {
  let signedIn = true;
  let attempts = 0;
  await page.route("**/api/user", route => signedIn ? route.fulfill({ json: user }) : route.fulfill({ status: 401, json: {} }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: { accountId: user.id, enabled: false } }));
  await page.route("**/api/account", route => {
    expect(route.request().method()).toBe("DELETE");
    expect(route.request().postDataJSON()).toEqual({ accountId: user.id, email: "ALICE@example.com" });
    if (++attempts === 1) return route.fulfill({ status: 409, json: { message: "Your account can't be deleted yet.", code: "account_deletion_blocked", blockers: ["You own Binary Labs.", "Delete your 2 personal audits first."] } });
    signedIn = false;
    return route.fulfill({ json: { deleted: true } });
  });
  await page.goto("/account/data");
  const button = page.getByRole("button", { name: "Delete my account" });
  await expect(button).toBeDisabled();
  await page.getByLabel(/to confirm/).fill("ALICE@example.com");
  await button.click();
  const alert = page.getByRole("alert").filter({ hasText: "can't be deleted yet" });
  await expect(alert).toContainText("You own Binary Labs.");
  await expect(alert).toContainText("Delete your 2 personal audits first.");
  await button.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Your account was deleted.")).toBeVisible();
});
