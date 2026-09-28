import { expect, test, type Page } from "@playwright/test";

type Role = "owner" | "member" | "viewer";

const account = { id: "account-a", displayName: "Account A", email: "a@example.test", grokSubject: null };
const roles: Record<string, Role> = { "workspace-a": "owner", "workspace-b": "viewer" };

function workspace(id: string, role: Role = roles[id] ?? "member") {
  return { id, name: `Team ${id}`, createdAt: "2026-09-25T12:00:00Z", role };
}

function auditFor(workspaceId: string, auditId = `audit-${workspaceId}`) {
  return {
    id: auditId,
    workspaceId,
    status: "completed",
    requestedBy: "creator-account-other",
    scheduleId: null,
    scope: { kind: "iac_text", format: "auto" },
    sourceRevision: null,
    sourceObservedAt: null,
    sourcePurged: false,
    specialists: ["devsecops", "sre"],
    partial: false,
    summary: `Shared history ${workspaceId}`,
    createdAt: "2026-09-25T12:00:00Z",
    updatedAt: "2026-09-25T12:01:00Z",
    retention: { inputAvailable: true, inputPurgeStatus: "retained", inputExpiresAt: null, historyExpiresAt: null, inputPurgedAt: null },
  };
}

async function mockSharedAuditApi(page: Page, options: {
  memberships?: () => Array<{ id: string; name: string; createdAt: string; role: Role }>;
  listStatus?: number;
  deleteResponse?: (count: number) => { status: number; json?: unknown };
  onCreate?: (body: Record<string, unknown>) => void;
} = {}) {
  let deletes = 0;
  let created = false;
  const auditRequests: Array<{ path: string; method: string }> = [];
  await page.route("**/api/user", (route) => route.fulfill({ json: account }));
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/workspaces**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    if (path === "/api/workspaces") {
      return route.fulfill({ json: { data: options.memberships?.() ?? [workspace("workspace-a")] } });
    }
    auditRequests.push({ path, method });
    const match = path.match(/^\/api\/workspaces\/([^/]+)\/jobs(?:\/([^/]+))?(?:\/(purge-source))?$/);
    if (!match) return route.fulfill({ status: 404, json: { error: "Not found" } });
    const [, workspaceId, auditId, action] = match;
    if (method === "POST" && !auditId) {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      options.onCreate?.(body);
      created = true;
      return route.fulfill({ status: 202, json: { ...auditFor(workspaceId, "audit-created"), requestedBy: account.id } });
    }
    if (action === "purge-source" && method === "POST") {
      return route.fulfill({ status: 202, json: {
        ok: true,
        sourcePurged: false,
        inputPurgeStatus: "pending",
        cleanupReceiptId: "cleanup-input-a",
        retention: { ...auditFor(workspaceId, auditId).retention, inputPurgeStatus: "pending" },
      } });
    }
    if (method === "DELETE") {
      deletes++;
      const result = options.deleteResponse?.(deletes) ?? { status: 202, json: { cleanupReceiptId: "cleanup-history-a", status: "pending" } };
      return route.fulfill({ status: result.status, ...(result.json === undefined ? {} : { json: result.json }) });
    }
    if (method === "GET" && auditId) {
      return route.fulfill({ json: {
        ...auditFor(workspaceId, auditId),
        findings: [{ id: "finding-a", severity: "high", title: "Review permissions", detail: "A broad role is attached.", resource: "module.web", remediation: "Narrow the role.", specialist: "devsecops" }],
        tasks: [],
        steps: [{ jobId: auditId, stepId: "step-a", agent: "sre", message: "Checked resilience.", ts: "2026-09-25T12:01:00Z" }],
      } });
    }
    if (method === "GET" && !auditId) {
      if (options.listStatus) return route.fulfill({ status: options.listStatus, json: { error: "Not found" } });
      return route.fulfill({ json: { jobs: created ? [auditFor(workspaceId), auditFor(workspaceId, "audit-created")] : [auditFor(workspaceId)] } });
    }
    return route.fulfill({ status: 404, json: { error: "Not found" } });
  });
  return { auditRequests, deleteCount: () => deletes };
}

async function openWorkspaceAudits(page: Page, workspaceId = "workspace-a") {
  await page.goto(`/dashboard/workspaces/${workspaceId}/jobs`);
  await expect(page.getByRole("heading", { name: new RegExp(`Team ${workspaceId} audits`) })).toBeVisible();
}

test.describe("workspace shared audits with rollout enabled", () => {
  test.skip(process.env.WORKSPACE_AUDIT_TEST_MODE !== "enabled", "Requires a feature-on production build");

  test("owner creates, reads, purges, and sees deletion poll to completion on explicit workspace routes", async ({ page }) => {
    let createBody: Record<string, unknown> | undefined;
    const api = await mockSharedAuditApi(page, {
      onCreate: (body) => { createBody = body; },
      deleteResponse: (count) => count < 3
        ? { status: 202, json: { cleanupReceiptId: "cleanup-history-a", status: "pending" } }
        : { status: 204 },
    });
    await openWorkspaceAudits(page);
    await expect(page.getByText("Shared history workspace-a")).toBeVisible();
    await page.getByRole("link", { name: "New shared audit" }).click();
    await page.getByLabel("Infrastructure configuration").fill("resource config");
    await page.getByRole("button", { name: "Queue shared audit" }).click();
    await expect(page).toHaveURL(/\/dashboard\/workspaces\/workspace-a\/jobs$/);
    await page.getByRole("button", { name: "Details" }).last().click();
    await expect(page.getByRole("heading", { name: "Audit details" })).toBeVisible();
    await expect(page.getByText(/Review permissions/)).toBeVisible();
    expect(createBody).toEqual({ scope: { kind: "iac_text", format: "auto", content: "resource config" }, specialists: ["devsecops", "sre"] });
    await expect.poll(() => api.auditRequests.some(({ path, method }) => path.endsWith("/jobs") && method === "POST")).toBe(true);

    await page.getByRole("button", { name: "Purge source" }).click();
    expect(api.auditRequests.some(({ path }) => path.endsWith("/purge-source"))).toBe(false);
    await page.getByRole("button", { name: "Confirm source purge" }).click();
    await expect(page.getByText(/Purge status: pending/)).toBeVisible();
    expect(api.auditRequests).toContainEqual({ path: "/api/workspaces/workspace-a/jobs/audit-created/purge-source", method: "POST" });

    await page.getByRole("button", { name: "Close details" }).click();
    await page.getByRole("button", { name: "Delete" }).first().click();
    expect(api.deleteCount()).toBe(0);
    await page.getByRole("button", { name: "Confirm audit deletion" }).click();
    await expect(page.getByRole("status")).toContainText("Audit deletion pending");
    await expect.poll(() => api.deleteCount(), { timeout: 8_000 }).toBeGreaterThanOrEqual(3);
    await expect(page.getByRole("status")).toContainText("Audit deletion completed");
    expect(api.auditRequests.filter(({ method, path }) => method === "DELETE" && path === "/api/workspaces/workspace-a/jobs/audit-workspace-a").length).toBeGreaterThanOrEqual(3);
  });

  test("members can create and read but do not get owner purge or delete controls", async ({ page }) => {
    const api = await mockSharedAuditApi(page, { memberships: () => [workspace("workspace-a", "member")] });
    await openWorkspaceAudits(page);
    await expect(page.getByRole("link", { name: "New shared audit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Details" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
    await page.getByRole("link", { name: "New shared audit" }).click();
    await page.getByLabel("Infrastructure configuration").fill("member source");
    await page.getByRole("button", { name: "Queue shared audit" }).click();
    await expect(page).toHaveURL(/\/dashboard\/workspaces\/workspace-a\/jobs$/);
    await page.getByRole("button", { name: "Details" }).last().click();
    await expect(page.getByRole("heading", { name: "Audit details" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Purge source" })).toHaveCount(0);
    expect(api.auditRequests.some(({ path, method }) => path.endsWith("/jobs") && method === "POST")).toBe(true);
    expect(api.auditRequests.some(({ method }) => method === "DELETE")).toBe(false);
  });

  test("viewers can read details but cannot create or run owner cleanup actions", async ({ page }) => {
    await mockSharedAuditApi(page, { memberships: () => [workspace("workspace-a", "viewer")] });
    await openWorkspaceAudits(page);
    await expect(page.getByText("Shared history workspace-a")).toBeVisible();
    await expect(page.getByRole("link", { name: "New shared audit" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
    await page.getByRole("button", { name: "Details" }).click();
    await expect(page.getByText(/Review permissions/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Purge source" })).toHaveCount(0);
  });

  test("keeps audit lists separate across workspace route changes", async ({ page }) => {
    const api = await mockSharedAuditApi(page, { memberships: () => [workspace("workspace-a", "member"), workspace("workspace-b", "viewer")] });
    await page.goto("/dashboard/workspaces");
    await page.getByRole("link", { name: "Shared audits" }).nth(0).click();
    await expect(page.getByText("Shared history workspace-a")).toBeVisible();
    await page.getByRole("link", { name: "All organizations" }).click();
    await page.getByRole("link", { name: "Shared audits" }).nth(1).click();
    await expect(page.getByText("Shared history workspace-b")).toBeVisible();
    await expect(page.getByText("Shared history workspace-a")).toHaveCount(0);
    expect(api.auditRequests).toContainEqual({ path: "/api/workspaces/workspace-a/jobs", method: "GET" });
    expect(api.auditRequests).toContainEqual({ path: "/api/workspaces/workspace-b/jobs", method: "GET" });
  });

  test("removes cached detail when refreshed membership no longer includes the workspace", async ({ page }) => {
    await page.clock.install();
    let active = true;
    await mockSharedAuditApi(page, { memberships: () => active ? [workspace("workspace-a", "member")] : [] });
    await openWorkspaceAudits(page);
    await page.getByRole("button", { name: "Details" }).click();
    await expect(page.getByText(/Review permissions/)).toBeVisible();
    active = false;
    await page.clock.fastForward(46_000);
    await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
    await expect(page.getByRole("heading", { name: "Organization unavailable" })).toBeVisible();
    await expect(page.getByText(/Review permissions/)).toHaveCount(0);
  });

  test("fails closed on API 404 and removes shared audit actions", async ({ page }) => {
    const api = await mockSharedAuditApi(page, { listStatus: 404 });
    await openWorkspaceAudits(page);
    await expect(page.getByText("Shared audits are unavailable. Confirm the feature is enabled and that you still belong to this organization.")).toBeVisible();
    await expect(page.getByRole("link", { name: "New shared audit" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
    expect(api.auditRequests).toContainEqual({ path: "/api/workspaces/workspace-a/jobs", method: "GET" });
  });
});
