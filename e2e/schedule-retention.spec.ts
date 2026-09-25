import { expect, test } from "@playwright/test";

const id = "00000000-0000-4000-8000-000000000001";
const policy = { accountId: "owner", enabled: true, version: "audit-minimal-v1", notice: ["Audit input expires after 15 minutes.", "Existing records receive at least 30 days from notice."], noticeDeliveredAt: null, legacyNotBefore: null, noticeArchived: false, noticeToken: "account-bound-notice" };

test("viewing notice does not acknowledge it; explicit acknowledgement records the displayed account and token", async ({ page }) => {
  let acknowledgements = 0;
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: [] } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: policy }));
  await page.route("**/api/account/retention/acknowledge", route => {
    expect(route.request().postDataJSON()).toEqual({ accountId: "owner", noticeToken: policy.noticeToken });
    acknowledgements++;
    return route.fulfill({ json: { ...policy, noticeArchived: true, noticeDeliveredAt: "2026-09-25T00:00:00Z", legacyNotBefore: "2026-10-25T00:00:00Z" } });
  });
  await page.goto("/jobs");
  await expect(page.getByText(policy.notice[1])).toBeVisible();
  expect(acknowledgements).toBe(0);
  await page.getByRole("button", { name: "I've read this retention policy" }).click();
  await expect(page.getByText("Notice recorded", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "I've read this retention policy" })).toHaveCount(0);
  expect(acknowledgements).toBe(1);
});

test("changed-account policy responses cannot offer acknowledgement", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: [] } }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: { ...policy, accountId: "another-owner" } }));
  await page.goto("/jobs");
  await expect(page.getByText("Your account changed. Reload the policy notice.")).toBeVisible();
  await expect(page.getByRole("button", { name: "I've read this retention policy" })).toHaveCount(0);
});

test("purged schedules require fresh input and deletion remains incomplete until confirmed by the API", async ({ page }) => {
  let hidden = false;
  let deleted = false;
  let available = false;
  const schedule = () => ({ id, name: "Saved review", cronExpression: "0 * * * *", timezone: "UTC", enabled: false, scope: {}, specialists: ["sre"], nextRunAt: null,
    retention: { inputAvailable: available, inputPurgeStatus: available ? "retained" : "purged", inputExpiresAt: null } });
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: { ...policy, enabled: false } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/schedules", route => route.fulfill({ json: { schedules: hidden ? [] : [schedule()] } }));
  await page.route(`**/api/schedules/${id}`, route => {
    if (route.request().method() === "PATCH") {
      expect(route.request().postDataJSON()).toEqual({ scope: { kind: "iac_text", format: "auto", content: "fresh input" }, telemetry: {}, enabled: false });
      available = true;
      return route.fulfill({ json: schedule() });
    }
    expect(route.request().method()).toBe("DELETE");
    hidden = true;
    return deleted ? route.fulfill({ status: 204 }) : route.fulfill({ status: 202, json: { status: "pending", cleanupReceiptId: id } });
  });
  await page.goto("/schedules");
  await expect(page.getByRole("button", { name: "Resume", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Supply fresh input" }).click();
  await page.getByLabel("Fresh IaC input").fill("fresh input");
  await page.getByRole("button", { name: "Replace input and keep paused" }).click();
  await expect(page.getByRole("button", { name: "Resume", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Delete schedule", exact: true }).click();
  await page.getByRole("button", { name: "Confirm schedule deletion" }).click();
  await expect(page.getByText("Schedule deletion incomplete.", { exact: false })).toBeVisible();
  await expect(page.getByText("Saved review", { exact: true })).toHaveCount(0);
  deleted = true;
  await page.getByRole("button", { name: "Check schedule deletion" }).click();
  await expect(page.getByText("Schedule deletion completed. Dispatched audits remain separate.")).toBeVisible();
});
