import { expect, test } from "./fixtures";
import type { RetentionPolicy } from "../src/lib/api";

test.use({ timezoneId: "Asia/Dhaka" });

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
  await expect(page.getByRole("region", { name: "Retention policy" })).toHaveCount(0);
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

test("reloads a fresh acknowledgement token after a rolling-deploy conflict", async ({ page }) => {
  let noticeFetches = 0;
  let acknowledgements = 0;
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: [] } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/account/retention", route => {
    noticeFetches++;
    return route.fulfill({ json: { ...policy, noticeToken: noticeFetches === 1 ? "pre-hash-token" : "hash-bound-token" } });
  });
  await page.route("**/api/account/retention/acknowledge", route => {
    acknowledgements++;
    const token = route.request().postDataJSON().noticeToken;
    if (acknowledgements === 1) {
      expect(token).toBe("pre-hash-token");
      return route.fulfill({ status: 409, json: { error: "Account or notice changed. Reload the policy notice." } });
    }
    expect(token).toBe("hash-bound-token");
    return route.fulfill({ json: { ...policy, noticeToken: token, noticeArchived: true, noticeDeliveredAt: "2026-09-25T00:00:00Z", legacyNotBefore: "2026-10-25T00:00:00Z" } });
  });

  await page.goto("/jobs");
  await expect(page.getByText(policy.notice[1])).toBeVisible();
  await page.getByRole("button", { name: "I've read this retention policy" }).click();
  await expect(page.getByText("Account or notice changed. Reload the policy notice.")).toBeVisible();
  await page.getByRole("button", { name: "Reload retention policy" }).click();
  await expect.poll(() => noticeFetches).toBe(2);
  await page.getByRole("button", { name: "I've read this retention policy" }).click();
  await expect(page.getByRole("region", { name: "Retention policy" })).toHaveCount(0);
  expect(acknowledgements).toBe(2);
});

test("advance notice can be recorded before automatic cleanup and survives reload", async ({ page }) => {
  let acknowledgements = 0;
  let state: RetentionPolicy = { ...policy, enabled: false, acknowledgementEnabled: true };
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: [] } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: state }));
  await page.route("**/api/account/retention/acknowledge", route => {
    expect(route.request().postDataJSON()).toEqual({ accountId: "owner", noticeToken: policy.noticeToken });
    acknowledgements++;
    state = { ...state, noticeArchived: true, noticeDeliveredAt: "2026-09-25T00:00:00Z", legacyNotBefore: "2026-10-25T00:00:00Z" };
    return route.fulfill({ json: state });
  });
  await page.goto("/jobs");
  await expect(page.getByText("Automatic retention is not active. Recording this notice starts your 30-day legacy grace period but does not activate cleanup.")).toBeVisible();
  expect(acknowledgements).toBe(0);
  await page.getByRole("button", { name: "I've read this retention policy" }).click();
  await expect(page.getByRole("region", { name: "Retention policy" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("region", { name: "Retention policy" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "I've read this retention policy" })).toHaveCount(0);
  expect(acknowledgements).toBe(1);
});

test("purged schedules require fresh input and deletion remains incomplete until confirmed by the API", async ({ page }) => {
  let hidden = false;
  let deleted = false;
  let available = false;
  let sourceRevision: string | null = null;
  let sourceObservedAt: string | null = null;
  const schedule = () => ({ id, name: "Saved review", cronExpression: "0 * * * *", timezone: "UTC", enabled: false, scope: {}, specialists: ["sre"], nextRunAt: null,
    sourceRevision: available ? sourceRevision : "private-old-revision", sourceObservedAt: available ? sourceObservedAt : "2026-09-25T10:00:00Z",
    retention: { inputAvailable: available, inputPurgeStatus: available ? "retained" : "purged", inputExpiresAt: null } });
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: { ...policy, enabled: false } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/schedules", route => route.fulfill({ json: { schedules: hidden ? [] : [schedule()] } }));
  await page.route(`**/api/schedules/${id}`, route => {
    if (route.request().method() === "PATCH") {
      const body = route.request().postDataJSON();
      expect(body.scope).toMatchObject({ kind: "iac_text", format: "auto" });
      expect(body.telemetry).toEqual({});
      expect(body.enabled).toBe(false);
      if (body.scope.content === "fresh input") {
        expect(body.sourceRevision).toBe("new-revision");
        expect(body.sourceObservedAt).toBe("2026-09-25T04:30:00Z");
        sourceRevision = body.sourceRevision;
        sourceObservedAt = body.sourceObservedAt;
      } else {
        expect(body.scope.content).toBe("replacement without metadata");
        expect(body).not.toHaveProperty("sourceRevision");
        expect(body).not.toHaveProperty("sourceObservedAt");
        sourceRevision = null;
        sourceObservedAt = null;
      }
      available = true;
      return route.fulfill({ json: schedule() });
    }
    expect(route.request().method()).toBe("DELETE");
    hidden = true;
    return deleted ? route.fulfill({ status: 204 }) : route.fulfill({ status: 202, json: { status: "pending", cleanupReceiptId: id } });
  });
  await page.goto("/schedules");
  await page.getByRole("link", { name: "Saved review" }).click();
  await expect(page).toHaveURL(new RegExp(`/schedules/${id}$`));
  await expect(page.getByRole("button", { name: "Resume", exact: true })).toBeDisabled();
  await expect(page.getByText("Input unavailable. Source metadata is hidden.")).toBeVisible();
  await expect(page.getByText(/private-old-revision/)).toHaveCount(0);
  await page.getByRole("button", { name: "Supply fresh input" }).click();
  await expect(page.getByRole("button", { name: "Replace input and keep paused" })).toBeDisabled();
  await page.getByLabel("Fresh IaC input").fill("fresh input");
  await page.getByLabel("Source revision").last().fill("new-revision");
  await page.getByLabel("Source observed at").last().fill("2026-09-25T10:30");
  await page.getByRole("button", { name: "Replace input and keep paused" }).click();
  await expect(page.getByRole("button", { name: "Resume", exact: true })).toBeEnabled();
  await expect(page.getByText("Caller-reported source revision: new-revision")).toBeVisible();
  await page.getByRole("button", { name: "Supply fresh input" }).click();
  await page.getByLabel("Fresh IaC input").fill("replacement without metadata");
  await page.getByRole("button", { name: "Replace input and keep paused" }).click();
  await expect(page.getByText("Caller-reported source revision: unknown")).toBeVisible();
  await page.getByRole("button", { name: "Delete schedule", exact: true }).click();
  await page.getByRole("button", { name: "Confirm schedule deletion" }).click();
  await expect(page.getByText("Schedule deletion incomplete.", { exact: false })).toBeVisible();
  await expect(page.getByText("Saved review", { exact: true })).toHaveCount(0);
  deleted = true;
  await page.getByRole("button", { name: "Check schedule deletion" }).click();
  await expect(page.getByText("Schedule deletion completed. Dispatched audits remain separate.")).toBeVisible();
});
