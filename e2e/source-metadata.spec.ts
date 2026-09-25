import { expect, test } from "@playwright/test";

test("audit creation sends paired caller metadata and job reads distinguish unknown from unavailable", async ({ page }) => {
  let createdBody: Record<string, unknown> | undefined;
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: { accountId: "owner", enabled: false } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/jobs", route => {
    if (route.request().method() === "POST") {
      createdBody = route.request().postDataJSON();
      return route.fulfill({ status: 202, json: { id: "created", status: "queued", createdAt: "2026-09-25T10:31:00Z" } });
    }
    return route.fulfill({ json: { jobs: [
      { id: "legacy", status: "completed", requestedBy: "owner", scope: {}, sourcePurged: false, specialists: [], partial: false, createdAt: "2026-09-25T10:00:00Z", sourceRevision: null, sourceObservedAt: null, retention: { inputAvailable: true } },
      { id: "recorded", status: "completed", requestedBy: "owner", scope: {}, sourcePurged: false, specialists: [], partial: false, createdAt: "2026-09-25T10:00:00Z", sourceRevision: "recorded-revision", sourceObservedAt: "2026-09-25T09:45:00Z", retention: { inputAvailable: true } },
      { id: "unavailable", status: "completed", requestedBy: "owner", scope: {}, sourcePurged: true, specialists: [], partial: false, createdAt: "2026-09-25T10:00:00Z", sourceRevision: "private-revision", sourceObservedAt: "2026-09-25T10:00:00Z", retention: { inputAvailable: false } },
    ] } });
  });

  await page.goto("/jobs");
  await page.getByLabel("IaC content").fill('resource "test" {}');
  await page.getByLabel("Source revision").fill("commit-abc");
  await page.getByLabel("Source observed at").fill("2026-09-25T10:30");
  await page.getByRole("button", { name: "Queue audit" }).click();

  await expect.poll(() => createdBody).toMatchObject({
    sourceRevision: "commit-abc",
    sourceObservedAt: new Date("2026-09-25T10:30:00").toISOString(),
  });
  await expect(page.getByText("Caller-reported source revision: unknown")).toBeVisible();
  await expect(page.getByText("Caller-reported source revision: recorded-revision")).toBeVisible();
  await expect(page.getByText("Input unavailable. Source metadata is hidden.")).toBeVisible();
  await expect(page.getByText(/private-revision/)).toHaveCount(0);
});
