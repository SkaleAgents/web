import { expect, test } from "./fixtures";
import { personalOrganization } from "./personal-organization-fixture";

const id = "0198f0b0-0000-7000-8000-000000000002";
const organization = { id, name: "Hosted fixture", kind: "team", role: "owner", createdAt: "2026-09-30T00:00:00Z" };

test("hosted Checkout returns to the dashboard and waits for verified server billing", async ({ page }) => {
  let paid = false;
  await page.route("**/api/user", route => route.fulfill({ json: { id: "fixture-owner", displayName: "Owner", email: "owner@example.test" } }));
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: [personalOrganization, organization] } }));
  await page.route(`**/api/workspaces/${id}`, route => route.fulfill({ json: { data: organization } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/organization-plans", route => route.fulfill({ json: { data: [
    { key: "free", name: "Free", monthlyUsd: 0, auditLimit: 2, checkoutMode: "included" },
    { key: "starter", name: "Starter", monthlyUsd: 19, auditLimit: 25, checkoutMode: "self_service" },
  ] } }));
  await page.route(`**/api/workspaces/${id}/billing`, route => route.fulfill({ json: {
    plan: paid ? "starter" : "free", usage: { used: 0, limit: paid ? 25 : 2, remaining: paid ? 25 : 2, periodEnd: "2026-10-30T00:00:00Z" },
    pendingChange: null, renewalPayment: null, testModeEnabled: true, cancellationEnabled: false,
  } }));
  await page.route(`**/api/workspaces/${id}/billing/checkout`, async route => {
    expect(route.request().postDataJSON()).toEqual({ plan: "starter", uiMode: "hosted_page" });
    await route.fulfill({ json: { uiMode: "hosted_page", url: "https://checkout.stripe.com/c/pay/cs_test_fixture" } });
  });
  // Simulates provider navigation; payment and webhook evidence are checked separately.
  await page.route("https://checkout.stripe.com/c/pay/cs_test_fixture", route => route.fulfill({
    contentType: "text/html", body: "<h1>Stripe sandbox Checkout</h1>",
  }));
  await page.goto(`/org/${id}/billing`);
  await page.getByRole("button", { name: "Start Starter" }).click();
  await expect(page).toHaveURL("https://checkout.stripe.com/c/pay/cs_test_fixture");
  await expect(page.getByRole("heading", { name: "Stripe sandbox Checkout" })).toBeVisible();
  await page.goto(`/org/${id}/billing?checkout=return`);
  await expect(page.getByRole("status", { name: "Checkout status" })).toContainText("Checking your payment");
  await expect(page.getByText("2 audits remaining", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Secure payment" })).toHaveCount(0);
  paid = true;
  await expect(page.getByText("25 audits remaining", { exact: true })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("status", { name: "Checkout status" })).toContainText("Starter is active");
  await expect(page).toHaveURL(new RegExp('/org/' + id + '/billing\\?checkout=return$'));
});
