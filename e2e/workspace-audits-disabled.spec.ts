import { expect, test } from "@playwright/test";

test("flag off hides shared-audit entry and direct route without sending audit requests", async ({ page }) => {
  test.skip(process.env.WORKSPACE_AUDIT_TEST_MODE !== "disabled", "Requires a feature-off production build");
  const auditRequests: string[] = [];
  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (/\/api\/workspaces\/[^/]+\/jobs/.test(pathname)) auditRequests.push(pathname);
  });
  await page.route("**/api/user", (route) => route.fulfill({ json: { id: "account-a", displayName: "Account A", email: "a@example.test", grokSubject: null } }));
  await page.route("**/api/workspaces", (route) => route.fulfill({ json: { data: [
    { id: "0198f0b0-0000-7000-8000-000000000001", name: "Platform team", createdAt: "2026-09-25T12:00:00Z", role: "owner" },
  ] } }));

  await page.goto("/workspaces");
  await expect(page.getByRole("heading", { name: "Platform team" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Shared audits" })).toHaveCount(0);
  await page.goto("/org/0198f0b0-0000-7000-8000-000000000001/jobs");
  await expect(page.getByText("Shared audits are not enabled for this deployment.")).toBeVisible();
  expect(auditRequests).toEqual([]);
});
