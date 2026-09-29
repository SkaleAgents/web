import { expect, test } from "@playwright/test";

test("shared history stays readable when creation is disabled", async ({ page }) => {
  test.skip(process.env.WORKSPACE_AUDIT_TEST_MODE !== "readonly", "Requires history-on, creation-off build");
  const requests: Array<{ method: string; path: string }> = [];
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: [
    { id: "0198f0b0-0000-7000-8000-000000000001", name: "Platform team", createdAt: "2026-09-25T12:00:00Z", role: "owner" },
  ] } }));
  await page.route("**/api/workspaces/0198f0b0-0000-7000-8000-000000000001/jobs**", route => {
    requests.push({ method: route.request().method(), path: new URL(route.request().url()).pathname });
    return route.fulfill({ json: { jobs: [] } });
  });

  await page.goto("/org/0198f0b0-0000-7000-8000-000000000001/jobs");
  await expect(page.getByRole("heading", { name: "Platform team audits" })).toBeVisible();
  await expect(page.getByRole("link", { name: "New shared audit" })).toHaveCount(0);
  await page.goto("/org/0198f0b0-0000-7000-8000-000000000001/jobs/new");
  await expect(page.getByText("Shared audit creation is not enabled for this deployment.")).toBeVisible();
  expect(requests).toEqual([{ method: "GET", path: "/api/workspaces/0198f0b0-0000-7000-8000-000000000001/jobs" }]);
});
