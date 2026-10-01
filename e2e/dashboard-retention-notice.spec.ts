import { expect, test } from "./fixtures";
import { personalOrganizationId } from "./personal-organization-fixture";

const noticeLine = "Existing records receive at least 30 days from this notice before automatic cleanup.";
const policy = {
  accountId: "owner",
  enabled: false,
  acknowledgementEnabled: true,
  version: "audit-minimal-v1",
  notice: [noticeLine],
  noticeDeliveredAt: null,
  legacyNotBefore: null,
  noticeArchived: false,
  noticeToken: "account-bound-notice",
};

test("personal dashboard asks for retention acceptance until the account records it", async ({ page }) => {
  let acknowledgements = 0;
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Harun R Rayhan", email: "owner@example.com" } }));
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: [] } }));
  await page.route("**/api/schedules", route => route.fulfill({ json: { schedules: [] } }));
  await page.route("**/api/bots", route => route.fulfill({ json: { bots: [] } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: policy }));
  await page.route("**/api/account/retention/acknowledge", route => {
    expect(route.request().postDataJSON()).toEqual({ accountId: "owner", noticeToken: policy.noticeToken });
    acknowledgements += 1;
    return route.fulfill({ json: { ...policy, noticeArchived: true, noticeDeliveredAt: "2026-10-01T04:30:00Z", legacyNotBefore: "2026-10-31T04:30:00Z" } });
  });

  await page.goto(`/org/${personalOrganizationId}`);
  const dialog = page.getByRole("dialog", { name: "Audit retention policy" });
  await expect(dialog.getByText(noticeLine)).toBeVisible();
  expect(acknowledgements).toBe(0);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "I've read this retention policy" }).click();
  await expect(dialog).toHaveCount(0);
  expect(acknowledgements).toBe(1);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("do it later hides the retention popup for 24 hours in this browser", async ({ page }) => {
  await page.context().addCookies([{ name: "skale_cookie_consent", value: "accepted", domain: "127.0.0.1", path: "/" }]);
  let acknowledgements = 0;
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Harun R Rayhan", email: "owner@example.com" } }));
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: [] } }));
  await page.route("**/api/schedules", route => route.fulfill({ json: { schedules: [] } }));
  await page.route("**/api/bots", route => route.fulfill({ json: { bots: [] } }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: policy }));
  await page.route("**/api/account/retention/acknowledge", route => {
    acknowledgements += 1;
    return route.fulfill({ status: 500, json: { message: "unexpected acknowledgement" } });
  });

  await page.goto(`/org/${personalOrganizationId}`);
  const dialog = page.getByRole("dialog", { name: "Audit retention policy" });
  await dialog.getByRole("button", { name: "Do it later" }).click();
  await expect(dialog).toHaveCount(0);
  expect(acknowledgements).toBe(0);
  const cookies = await page.context().cookies();
  expect(cookies.some(cookie => cookie.name === "skale_retention_later")).toBe(true);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(acknowledgements).toBe(0);
});
