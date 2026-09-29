import { expect, test } from "./fixtures";
import { personalOrganization } from "./personal-organization-fixture";

const workspaceId = "0198f0b0-0000-7000-8000-000000000077";
const organization = { id: workspaceId, name: "No-email organization", kind: "team", role: "owner", cutoverNoticeAvailable: true, createdAt: "2026-09-29T00:00:00Z" };
const notice = {
  workspaceId,
  version: "free-org-v1",
  contentHash: "a".repeat(64),
  effectiveAt: "2026-11-01T00:00:00+00:00",
  body: "Free organization audits: two accepted audits per UTC calendar month from November 1, 2026.",
  billingUrl: "https://skaleagents.com/dashboard/billing",
  supportUrl: "https://skaleagents.com/contact",
  acknowledgementEnabled: true,
  acknowledgedAt: null as string | null,
  noticeToken: "synthetic-notice-token",
};

test("an owner without email reviews and records the Free organization notice", async ({ page }) => {
  let acknowledgedAt: string | null = null;
  await page.route("**/api/user", route => route.fulfill({ json: { id: "no-email-owner", displayName: "Owner", email: null, agreementRequired: false } }));
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: [personalOrganization, organization] } }));
  await page.route(`**/api/workspaces/${workspaceId}`, route => route.fulfill({ json: { data: organization } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route(`**/api/workspaces/${workspaceId}/cutover-notice`, route => route.fulfill({ json: { ...notice, acknowledgedAt } }));
  await page.route(`**/api/workspaces/${workspaceId}/cutover-notice/acknowledge`, route => {
    expect(route.request().postDataJSON()).toEqual({ workspaceId, noticeToken: notice.noticeToken });
    acknowledgedAt = "2026-10-01T12:00:00+00:00";
    return route.fulfill({ json: { ...notice, acknowledgedAt } });
  });

  await page.goto("/dashboard/workspaces");
  await page.getByRole("link", { name: "Review Free plan notice" }).click();
  await expect(page).toHaveURL(`/org/${workspaceId}/settings/cutover-notice`);
  await expect(page.getByText(notice.body)).toBeVisible();
  await expect(page.getByText(/November 1, 2026.*UTC/)).toBeVisible();
  await page.getByRole("button", { name: "Record that I have read this notice" }).click();
  await expect(page.getByText(/Notice recorded/)).toBeVisible();
  expect(acknowledgedAt).toBe("2026-10-01T12:00:00+00:00");
});
