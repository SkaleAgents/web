import { expect, test } from "./fixtures";

test.use({ timezoneId: "Asia/Dhaka" });

test("audit creation submits paired source metadata and job reads distinguish unknown, recorded, and unavailable", async ({ page }) => {
  let createdBody: Record<string, unknown> | undefined;
  const jobRows = [
    { id: "legacy", status: "completed", requestedBy: "owner", scope: {}, sourcePurged: false, specialists: [], partial: false, createdAt: "2026-09-25T10:00:00Z", sourceRevision: null, sourceObservedAt: null, retention: { inputAvailable: true } },
    { id: "recorded", status: "completed", requestedBy: "owner", scope: {}, sourcePurged: false, specialists: [], partial: false, createdAt: "2026-09-25T10:00:00Z", sourceRevision: "recorded-revision", sourceObservedAt: "2026-09-25T09:45:00Z", retention: { inputAvailable: true } },
    { id: "unavailable", status: "completed", requestedBy: "owner", scope: {}, sourcePurged: true, specialists: [], partial: false, createdAt: "2026-09-25T10:00:00Z", sourceRevision: "private-revision", sourceObservedAt: "2026-09-25T10:00:00Z", retention: { inputAvailable: false } },
  ];
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: { accountId: "owner", enabled: false } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/jobs", route => {
    if (route.request().method() === "POST") {
      createdBody = route.request().postDataJSON();
      return route.fulfill({ status: 202, json: { id: "created", status: "queued", createdAt: "2026-09-25T10:31:00Z" } });
    }
    return route.fulfill({ json: { jobs: jobRows } });
  });
  await page.route("**/api/jobs/*", route => {
    const id = route.request().url().split("/").at(-1);
    return route.fulfill({ json: jobRows.find(job => job.id === id) ?? { ...jobRows[0], id: "created", status: "queued" } });
  });

  await page.goto("/me/jobs/new");
  await page.getByText("Advanced options", { exact: true }).click();
  await page.getByLabel("IaC content").fill('resource "test" {}');
  await page.getByLabel("Source revision").fill("commit-audit");
  await page.getByLabel("Source observed at").fill("2026-09-25T10:30");
  await page.getByRole("button", { name: "Start audit" }).click();

  await expect.poll(() => createdBody).toMatchObject({
    scope: { kind: "iac_text", content: 'resource "test" {}' },
    sourceRevision: "commit-audit",
    sourceObservedAt: "2026-09-25T04:30:00Z",
  });
  await expect(page).toHaveURL(/\/jobs\/created$/);
  await page.getByRole("link", { name: "Back to audit jobs" }).click();
  await page.getByRole("link", { name: "View audit" }).nth(0).click();
  await expect(page.getByText("Caller-reported source revision: unknown")).toBeVisible();
  await page.getByRole("link", { name: "Back to audit jobs" }).click();
  await page.getByRole("link", { name: "View audit" }).nth(1).click();
  await expect(page.getByText("Caller-reported source revision: recorded-revision")).toBeVisible();
  await page.getByRole("link", { name: "Back to audit jobs" }).click();
  await page.getByRole("link", { name: "View audit" }).nth(2).click();
  await expect(page.getByText("Input unavailable. Source metadata is hidden.")).toBeVisible();
  await expect(page.getByText(/private-revision/)).toHaveCount(0);
});

test("audit form rejects one-sided metadata before sending a request", async ({ page }) => {
  let createCalls = 0;
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: { accountId: "owner", enabled: false } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/jobs", route => {
    if (route.request().method() === "POST") createCalls++;
    return route.fulfill({ json: { jobs: [] } });
  });

  await page.goto("/me/jobs/new");
  await page.getByText("Advanced options", { exact: true }).click();
  await page.getByLabel("IaC content").fill('resource "test" {}');
  await page.getByLabel("Source revision").fill("only-revision");
  await page.getByRole("button", { name: "Start audit" }).click();

  await expect(page.getByText("Enter both a source revision and observation time, or leave both blank")).toBeVisible();
  expect(createCalls).toBe(0);
  await expect(page.getByLabel("IaC content")).toHaveValue('resource "test" {}');
  await expect(page.getByRole("button", { name: "Start audit", exact: true })).toBeEnabled();
});

test("schedule creation submits a paired caller revision and observation time", async ({ page }) => {
  let createdBody: Record<string, unknown> | undefined;
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: { accountId: "owner", enabled: false } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/schedules", route => {
    if (route.request().method() === "POST") {
      createdBody = route.request().postDataJSON();
      return route.fulfill({ status: 201, json: { id: "schedule-created" } });
    }
    return route.fulfill({ json: { schedules: [] } });
  });

  await page.goto("/schedules");
  await page.getByLabel("Scheduled IaC content").fill('resource "test" {}');
  await page.getByLabel("Source revision").fill("commit-schedule");
  await page.getByLabel("Source observed at").fill("2026-09-25T10:30");
  await page.getByRole("button", { name: "Create schedule" }).click();

  await expect.poll(() => createdBody).toMatchObject({
    scope: { kind: "iac_text", content: 'resource "test" {}' },
    sourceRevision: "commit-schedule",
    sourceObservedAt: "2026-09-25T04:30:00Z",
  });
});
