import { expect, test } from "./fixtures";
import { personalOrganization } from "./personal-organization-fixture";

const id = "0198f0b0-0000-7000-8000-000000000002";
const organization = { id, name: "Embedded fixture", kind: "team", role: "owner", createdAt: "2026-09-30T00:00:00Z" };

test("embedded completion waits for verified server billing", async ({ page }) => {
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
    expect(route.request().postDataJSON()).toEqual({ plan: "starter", uiMode: "embedded_page" });
    await route.fulfill({ json: { uiMode: "embedded_page", clientSecret: "cs_test_fixture_secret_fixture", publishableKey: "pk_test_fixture" } });
  });
  // Simulated Stripe UI validates our lifecycle. The separate provider test uses real Stripe.
  await page.route("https://js.stripe.com/**", route => route.fulfill({ contentType: "application/javascript", body: `
    window.Stripe = function () { return { createEmbeddedCheckoutPage: async function (options) {
      let container;
      return { mount: function (element) {
        container = element;
        const button = document.createElement('button');
        button.textContent = 'Simulate payment completion';
        button.onclick = options.onComplete;
        container.appendChild(button);
      }, destroy: function () { if (container) container.replaceChildren(); } };
    } }; };
  ` }));
  await page.goto(`/org/${id}/billing`);
  await page.getByRole("button", { name: "Start Starter" }).click();
  await expect(page.getByRole("region", { name: "Secure payment" })).toBeVisible();
  await page.getByRole("button", { name: "Simulate payment completion" }).click();
  await expect(page.getByRole("status", { name: "Checkout status" })).toContainText("Checking your payment");
  await expect(page.getByText("2 audits remaining", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Secure payment" })).toHaveCount(0);
  paid = true;
  await expect(page.getByText("25 audits remaining", { exact: true })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("status", { name: "Checkout status" })).toContainText("Starter is active");
  await expect(page).toHaveURL(new RegExp('/org/' + id + '/billing$'));
});
