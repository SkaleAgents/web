import { expect, test } from "./fixtures";
import { personalOrganization } from "./personal-organization-fixture";

const organizationId = "0198f0b0-0000-7000-8000-000000000002";
const organization = {
  id: organizationId, name: "Recovery fixture", kind: "team", role: "owner",
  createdAt: "2026-09-29T00:00:00Z",
};

test("owner billing explains unpaid recovery and validates invoice links", async ({ page }) => {
  let status: "unpaid" | "recovered" | "verification_unavailable" = "unpaid";
  let invoiceUrl: string | null = "https://invoice.stripe.com/i/synthetic";
  await page.route("**/api/user", route => route.fulfill({ json: {
    id: "recovery-owner", displayName: "Fixture Owner", email: "owner@example.com",
  } }));
  await page.route("**/api/workspaces", route => route.fulfill({ json: {
    data: [personalOrganization, organization],
  } }));
  await page.route(`**/api/workspaces/${organizationId}`, route => route.fulfill({ json: {
    data: organization,
  } }));
  await page.route("**/api/organization-plans", route => route.fulfill({ json: { data: [
    { key: "free", name: "Free", monthlyUsd: 0, auditLimit: 2, checkoutMode: "included" },
    { key: "starter", name: "Starter", monthlyUsd: 19, auditLimit: 25, checkoutMode: "stripe" },
    { key: "pro", name: "Pro", monthlyUsd: 49, auditLimit: 200, checkoutMode: "stripe" },
  ] } }));
  await page.route(`**/api/workspaces/${organizationId}/billing`, route => route.fulfill({ json: {
    plan: "pro",
    usage: status === "recovered" ? {
      used: 0, limit: 200, remaining: 200, periodEnd: "2026-10-29T00:00:00Z",
    } : null,
    pendingChange: null,
    renewalPayment: {
      status, graceEndsAt: null, finalizationEndsAt: null,
      paymentUrl: status === "unpaid" ? invoiceUrl : null,
    },
    testModeEnabled: false, cancellationEnabled: false,
  } }));

  await page.goto(`/org/${organizationId}/billing`);
  const notice = page.getByRole("status", { name: "Renewal payment" });
  await expect(notice).toContainText("New audits and schedules are paused");
  await expect(page.getByText(/audits remaining/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Pay renewal invoice" }))
    .toHaveAttribute("href", "https://invoice.stripe.com/i/synthetic");

  invoiceUrl = "https://invoice.stripe.com.evil.example/i/synthetic";
  await page.reload();
  await expect(notice).toContainText("New audits and schedules are paused");
  await expect(page.getByRole("link", { name: "Pay renewal invoice" })).toHaveCount(0);

  status = "verification_unavailable";
  await page.reload();
  await expect(notice).toContainText("We could not verify your renewal");
  await expect(page.getByRole("link", { name: "Pay renewal invoice" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Contact support" }))
    .toHaveAttribute("href", "mailto:info@skaleagents.com");

  status = "recovered";
  await page.reload();
  await expect(notice).toContainText("Schedules paused during nonpayment are still off");
  await expect(page.getByRole("link", { name: "Review paused schedules" }))
    .toHaveAttribute("href", `/org/${organizationId}/schedules`);
});
