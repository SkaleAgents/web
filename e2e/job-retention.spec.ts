import { expect, test } from "@playwright/test";

const id = "00000000-0000-4000-8000-000000000001";
const baseJob = { id, status: "completed", summary: "Finished review", requestedBy: "owner", sourcePurged: false, specialists: ["sre"], partial: false, scope: {}, createdAt: "2026-09-25T00:00:00Z", updatedAt: "2026-09-25T00:00:00Z" };

test("input cleanup stays visibly incomplete and deletion waits for actual completion", async ({ page }) => {
  let hidden = false;
  let deleted = false;
  let deleteCalls = 0;
  let purgeStatus = "retained";
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: hidden ? [] : [{ ...baseJob, scheduleId: "schedule", retention: { inputAvailable: purgeStatus === "retained", inputPurgeStatus: purgeStatus, inputExpiresAt: null, historyExpiresAt: null, inputPurgedAt: null } }] } }));
  await page.route(`**/api/jobs/${id}/purge-source`, route => {
    purgeStatus = "pending";
    return route.fulfill({ status: 202, json: { ok: true, sourcePurged: false, retention: { inputPurgeStatus: "pending", inputPurgedAt: null } } });
  });
  await page.route(`**/api/jobs/${id}`, route => {
    expect(route.request().method()).toBe("DELETE");
    deleteCalls++;
    hidden = true;
    return deleted ? route.fulfill({ status: 204 }) : route.fulfill({ status: 202, json: { ok: true, status: "pending" } });
  });
  await page.goto("/jobs");
  await expect(page.getByText("The recurring schedule keeps a separate input copy.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Purge audit input", exact: true }).click();
  await page.getByRole("button", { name: "Confirm input purge", exact: true }).click();
  await expect(page.getByText("Input cleanup pending. Input is hidden while removal finishes.")).toBeVisible();
  await expect(page.getByText("Input cleanup completed across live stores.")).toHaveCount(0);
  await page.getByRole("button", { name: "Delete audit", exact: true }).click();
  await page.getByRole("button", { name: "Confirm audit deletion", exact: true }).click();
  await expect(page.getByText("Audit deletion pending. It is hidden from normal reads. Status refreshes automatically.")).toBeVisible();
  await expect(page.getByText("Finished review", { exact: true })).toHaveCount(0);
  await expect.poll(() => deleteCalls).toBeGreaterThan(1);
  deleted = true;
  await expect(page.getByText("Audit deletion completed across live stores.")).toBeVisible({ timeout: 7000 });
});

test("active audits require confirmed cancellation before cleanup controls appear", async ({ page }) => {
  let status = "running";
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: [{ ...baseJob, status }] } }));
  await page.route(`**/api/jobs/${id}/cancel`, route => {
    status = "failed";
    return route.fulfill({ json: { ...baseJob, status } });
  });
  await page.goto("/jobs");
  await expect(page.getByRole("button", { name: "Cancel audit", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Purge audit input", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Cancel audit", exact: true }).click();
  await page.getByRole("button", { name: "Confirm cancellation", exact: true }).click();
  await expect(page.getByRole("button", { name: "Purge audit input", exact: true })).toBeVisible();
});
