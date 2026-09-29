import { expect, test, type Page } from "@playwright/test";

type Role = "owner" | "member" | "viewer";

async function mock(page: Page, role: Role, member = true) {
  const requests: string[] = [];
  await page.route("**/api/user", (route) => route.fulfill({ json: { id: "account-a", displayName: "Account A", email: "a@example.test" } }));
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/workspaces**", (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (path === "/api/workspaces") return route.fulfill({ json: { data: member ? [{ id: "0198f0b0-0000-7000-8000-000000000001", name: "Platform team", role }] : [] } });
    requests.push(`${method} ${path}`);
    if (path === "/api/workspaces/0198f0b0-0000-7000-8000-000000000001/schedules" && method === "GET") return route.fulfill({ json: { schedules: [{
      id: "schedule-a", workspaceId: "0198f0b0-0000-7000-8000-000000000001", createdBy: "departed-creator", name: "Weekly review",
      cronExpression: "0 0 * * 1", timezone: "UTC", scope: { kind: "iac_text", format: "auto", content: "config" },
      specialists: ["devsecops"], enabled: false, nextRunAt: null, lastRunAt: null, lastJobId: "job-a",
      lastError: "Paused because the active schedule plan limit was reached",
      retention: { inputAvailable: true, inputPurgeStatus: "retained", inputExpiresAt: null },
      createdAt: "2026-09-25T12:00:00Z", updatedAt: "2026-09-25T12:00:00Z",
    }] } });
    if (path === "/api/workspaces/0198f0b0-0000-7000-8000-000000000001/schedules" && method === "POST") return route.fulfill({ status: 201, json: { id: "schedule-b", workspaceId: "0198f0b0-0000-7000-8000-000000000001", enabled: true } });
    if (path.endsWith("/schedule-a") && method === "PATCH") return route.fulfill({ json: { id: "schedule-a", workspaceId: "0198f0b0-0000-7000-8000-000000000001", enabled: true } });
    if (path.endsWith("/purge-source") && method === "POST") return route.fulfill({ status: 202, json: { cleanupReceiptId: "receipt-a", inputPurgeStatus: "pending" } });
    if (path.endsWith("/schedule-a") && method === "DELETE") return route.fulfill({ status: 202, json: { cleanupReceiptId: "receipt-b", status: "pending" } });
    return route.fulfill({ status: 404, json: { error: "Not found" } });
  });
  return requests;
}

test.describe("organization schedules", () => {
  test.skip(process.env.WORKSPACE_SCHEDULE_TEST_MODE !== "enabled", "Requires the schedules-enabled production build");

  test("owner sees a departed creator's schedule and confirms cleanup", async ({ page }) => {
    const requests = await mock(page, "owner");
    await page.goto("/org/0198f0b0-0000-7000-8000-000000000001/schedules");
    await expect(page.getByText("Weekly review")).toBeVisible();
    await expect(page.getByText(/active schedule plan limit/)).toBeVisible();
    await page.getByRole("button", { name: "Purge input" }).click();
    expect(requests.some((request) => request.includes("purge-source"))).toBe(false);
    await page.getByRole("button", { name: "Confirm purge" }).click();
    await expect.poll(() => requests.some((request) => request === "POST /api/workspaces/0198f0b0-0000-7000-8000-000000000001/schedules/schedule-a/purge-source")).toBe(true);
  });

  test("member can edit without owner cleanup controls", async ({ page }) => {
    await mock(page, "member");
    await page.goto("/org/0198f0b0-0000-7000-8000-000000000001/schedules");
    await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Purge input" })).toHaveCount(0);
    await page.getByRole("button", { name: "Edit settings" }).click();
    await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
  });

  test("a removed member sees no direct-route schedule data", async ({ page }) => {
    const requests = await mock(page, "member", false);
    await page.goto("/org/0198f0b0-0000-7000-8000-000000000001/schedules");
    await expect(page.getByRole("heading", { name: "Organization unavailable" })).toBeVisible();
    expect(requests).toEqual([]);
  });

  test("viewer sees only read controls", async ({ page }) => {
    await mock(page, "viewer");
    await page.goto("/org/0198f0b0-0000-7000-8000-000000000001/schedules");
    await expect(page.getByText("Weekly review")).toBeVisible();
    await expect(page.getByRole("button", { name: "Resume" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Create schedule" })).toHaveCount(0);
  });
});
