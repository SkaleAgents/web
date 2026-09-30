import { expect, test, type Page } from "./fixtures";
import { personalOrganizationId, personalOrganization } from "./personal-organization-fixture";

const account = { id: "account-a", displayName: "Account A", email: "a@example.test", grokSubject: null };
const coverage = {
  basis: "rule_execution", ruleLevelChecksAvailable: true, recordingStatus: "available",
  limitation: "These checks review supplied input.", counts: { evaluated: 1, partial: 0, skipped: 2, failed: 0 }, tasksWithoutCoverage: 0,
  tasks: [{ specialist: "sre", status: "completed", hasSkipReason: false, checkCoverage: { version: "builtin-coverage-v1", checks: [
    { ruleId: "sre.elevated-error-rate", status: "evaluated", completeness: "complete", findingCount: 0, reasonCodes: [] },
    { ruleId: "sre.failed-crons", status: "skipped", completeness: "none", findingCount: 0, reasonCodes: ["missing_input"] },
    { ruleId: "sre.retry-pattern", status: "skipped", completeness: "none", findingCount: 0, reasonCodes: ["missing_input"] },
  ] } }],
};
function audit(id = "coverage-job") {
  return { id, workspaceId: personalOrganizationId, requestedBy: account.id, status: "completed", partial: true, specialists: ["sre"],
    scope: { kind: "iac_text", format: "kubernetes" }, sourcePurged: false, summary: "Review complete",
    createdAt: "2026-09-30T00:00:00Z", updatedAt: "2026-09-30T00:01:00Z", coverage, tasks: coverage.tasks,
    findings: [], steps: [], retention: { inputAvailable: true, inputPurgeStatus: "retained", inputExpiresAt: null, historyExpiresAt: null, inputPurgedAt: null } };
}
async function keyboardDisclosure(page: Page) {
  const panel = page.getByRole("region", { name: "Check coverage" });
  await expect(panel.getByText("1 evaluated · 2 skipped · 0 failed")).toBeVisible();
  const summary = panel.locator("summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(panel.getByText("Evaluated, no findings")).toBeVisible();
  await page.keyboard.press("Space");
  await expect(panel.getByText("Evaluated, no findings")).not.toBeVisible();
}

test("personal audit shows recorded coverage with keyboard disclosure", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: account }));
  await page.route("**/api/jobs/coverage-job", route => route.fulfill({ json: audit() }));
  await page.goto(`/org/${personalOrganizationId}/jobs/coverage-job`);
  await keyboardDisclosure(page);
});

test("personal historical audit never implies checks passed", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: account }));
  await page.route("**/api/jobs/coverage-old", route => route.fulfill({ json: { ...audit("coverage-old"), coverage: undefined, tasks: [] } }));
  await page.goto(`/org/${personalOrganizationId}/jobs/coverage-old`);
  await expect(page.getByText("Check details unavailable")).toBeVisible();
});

test("shared audit uses the same coverage component and resets between jobs", async ({ page }) => {
  test.skip(process.env.WORKSPACE_AUDIT_TEST_MODE !== "enabled", "Requires feature-on build");
  const team = { ...personalOrganization, kind: "team", name: "Coverage team" };
  await page.route("**/api/user", route => route.fulfill({ json: account }));
  await page.route("**/api/workspaces**", route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/workspaces") return route.fulfill({ json: { data: [team] } });
    if (path === `/api/workspaces/${team.id}`) return route.fulfill({ json: { data: team } });
    if (path.endsWith("/jobs")) return route.fulfill({ json: { jobs: [audit(), audit("old")] } });
    if (path.endsWith("/jobs/old")) return route.fulfill({ json: { ...audit("old"), coverage: undefined, tasks: [] } });
    if (path.endsWith("/jobs/coverage-job")) return route.fulfill({ json: audit() });
    return route.fulfill({ status: 404, json: { error: "Not found" } });
  });
  await page.goto(`/org/${team.id}/jobs`);
  await page.getByRole("button", { name: "Details", exact: true }).first().click();
  await keyboardDisclosure(page);
  await page.getByRole("button", { name: "Close details" }).click();
  await page.getByRole("button", { name: "Details", exact: true }).last().click();
  await expect(page.getByText("Check details unavailable")).toBeVisible();
  await expect(page.getByText("1 evaluated · 2 skipped · 0 failed")).not.toBeVisible();
});

test("coverage disclosure stays expanded when a pending audit finishes", async ({ page }) => {
  let complete = false;
  await page.route("**/api/user", route => route.fulfill({ json: account }));
  await page.route("**/api/jobs/coverage-job", route => route.fulfill({ json: complete ? audit() : {
    ...audit(), status: "running", coverage: undefined, tasks: [{ specialist: "sre", status: "running" }],
  } }));
  await page.goto(`/org/${personalOrganizationId}/jobs/coverage-job`);
  const panel = page.getByRole("region", { name: "Check coverage" });
  await panel.locator("summary").click();
  await expect(panel.getByText("Awaiting results")).toBeVisible();
  complete = true;
  await expect(panel.getByText("Evaluated, no findings")).toBeVisible({ timeout: 8000 });
});
