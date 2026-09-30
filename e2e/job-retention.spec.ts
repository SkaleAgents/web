import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/account/retention", route => route.fulfill({ json: { accountId: "owner", enabled: false } }));
});

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
  await page.route(`**/api/jobs/${id}`, async route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { ...baseJob, scheduleId: "schedule", retention: { inputAvailable: purgeStatus === "retained", inputPurgeStatus: purgeStatus, inputExpiresAt: null, historyExpiresAt: null, inputPurgedAt: null } } });
    expect(route.request().method()).toBe("DELETE");
    deleteCalls++;
    hidden = true;
    if (deleted) return route.fulfill({ status: 204 });
    if (deleteCalls === 2) await new Promise(resolve => setTimeout(resolve, 300));
    return route.fulfill({ status: 202, json: { ok: true, status: deleteCalls === 1 ? "pending" : "processing" } });
  });
  await page.goto("/jobs");
  await page.getByRole("link", { name: "View audit" }).click();
  await expect(page.getByText("The recurring schedule keeps a separate input copy.", { exact: false })).toBeVisible();
  await page.getByText("Manage retained data", { exact: true }).click();
  await page.getByRole("button", { name: "Purge audit input", exact: true }).click();
  await page.getByRole("button", { name: "Confirm input purge", exact: true }).click();
  await expect(page.getByText("Input cleanup pending. Input is hidden while removal finishes.")).toBeVisible();
  await expect(page.getByText("Input cleanup completed across live stores.")).toHaveCount(0);
  await page.getByRole("button", { name: "Delete audit", exact: true }).click();
  await page.getByRole("button", { name: "Confirm audit deletion", exact: true }).click();
  await expect(page.getByText("Audit deletion pending. It is hidden from normal reads. Status refreshes automatically.")).toBeVisible();
  await expect(page.getByText("Finished review", { exact: true })).toHaveCount(0);
  await expect.poll(() => deleteCalls).toBeGreaterThan(1);
  await expect(page.getByText("Audit deletion is processing. Status refreshes automatically.")).toBeVisible();
  deleted = true;
  await expect(page.getByText("Audit deletion completed across live stores.")).toBeVisible({ timeout: 7000 });
});

test("legacy sourcePurged jobs still poll until retention input cleanup completes", async ({ page }) => {
  let purgeRequested = false;
  let detailReads = 0;
  const job = { ...baseJob, sourcePurged: true } as Record<string, unknown>;
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route(`**/api/jobs/${id}/purge-source`, async route => {
    purgeRequested = true;
    await route.fulfill({ status: 202, json: { ok: true, sourcePurged: false, retention: { inputAvailable: false, inputPurgeStatus: "pending", inputExpiresAt: null, historyExpiresAt: null, inputPurgedAt: null } } });
  });
  await page.route(`**/api/jobs/${id}`, async route => {
    detailReads++;
    const retention = purgeRequested && detailReads >= 3
      ? { inputAvailable: false, inputPurgeStatus: "purged", inputExpiresAt: null, historyExpiresAt: null, inputPurgedAt: new Date().toISOString() }
      : purgeRequested ? { inputAvailable: false, inputPurgeStatus: "pending", inputExpiresAt: null, historyExpiresAt: null, inputPurgedAt: null } : undefined;
    await route.fulfill({ json: { ...job, ...(retention ? { retention } : {}) } });
  });
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: [job] } }));

  await page.goto("/jobs");
  await page.getByRole("link", { name: "View audit" }).click();
  await expect(page.getByText("Source content was previously purged. Other input may remain.")).toBeVisible();
  await page.getByText("Manage retained data", { exact: true }).click();
  await page.getByRole("button", { name: "Purge audit input", exact: true }).click();
  await page.getByRole("button", { name: "Confirm input purge", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Input cleanup pending.");
  await expect(page.getByRole("status")).toContainText("Input cleanup completed across live stores.", { timeout: 7000 });
});

test("active audits require confirmed cancellation before cleanup controls appear", async ({ page }) => {
  let status = "running";
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: [{ ...baseJob, status }] } }));
  await page.route(`**/api/jobs/${id}`, route => route.fulfill({ json: { ...baseJob, status } }));
  await page.route(`**/api/jobs/${id}/cancel`, route => {
    status = "failed";
    return route.fulfill({ json: { ...baseJob, status } });
  });
  await page.goto("/jobs");
  await page.getByRole("link", { name: "View audit" }).click();
  await expect(page.getByRole("button", { name: "Cancel audit", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Purge audit input", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Cancel audit", exact: true }).click();
  await page.getByRole("button", { name: "Confirm cancellation", exact: true }).click();
  await page.getByText("Manage retained data", { exact: true }).click();
  await expect(page.getByRole("button", { name: "Purge audit input", exact: true })).toBeVisible();
});
