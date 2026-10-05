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
  await expect(panel.getByText("Failed scheduled jobs")).toBeVisible();
  const summary = panel.locator("summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(panel.getByText("Failed scheduled jobs")).not.toBeVisible();
  await page.keyboard.press("Space");
  await expect(panel.getByText("Failed scheduled jobs")).toBeVisible();
}

test("personal audit shows recorded coverage with keyboard disclosure", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: account }));
  await page.route("**/api/jobs/coverage-job", route => route.fulfill({ json: audit() }));
  await page.goto(`/org/${personalOrganizationId}/jobs/coverage-job`);
  await page.getByRole("tab", { name: "Advanced" }).click();
  await keyboardDisclosure(page);
});

test("personal historical audit never implies checks passed", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: account }));
  await page.route("**/api/jobs/coverage-old", route => route.fulfill({ json: { ...audit("coverage-old"), coverage: undefined, tasks: [] } }));
  await page.goto(`/org/${personalOrganizationId}/jobs/coverage-old`);
  await page.getByRole("tab", { name: "Advanced" }).click();
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
  await page.getByRole("tab", { name: "Advanced" }).click();
  const panel = page.getByRole("region", { name: "Check coverage" });
  await panel.locator("summary").click();
  await expect(panel.getByText("Awaiting results")).toBeVisible();
  complete = true;
  await expect(panel.getByText("Evaluated, no findings")).toBeVisible({ timeout: 8000 });
});


test("audit findings and report action stay clear across dashboard layouts", async ({ page }, testInfo) => {
  await page.route("**/api/user", route => route.fulfill({ json: account }));
  await page.route("**/api/jobs/design-review", route => route.fulfill({ json: { ...audit("design-review"), findings: [{ severity: "high", title: "Public network access detected", detail: "The security group permits public ingress on port 22.", resource: "aws_security_group.review_fixture", remediation: "Restrict ingress to the approved network.", specialist: "devsecops" }] } }));
  await page.goto(`/org/${personalOrganizationId}/jobs/design-review`);
  await expect(page.getByRole("heading", { name: "Public network access detected" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Anyone on the internet can reach this." })).toBeVisible();
  await expect(page.getByText("Restrict ingress to the approved network.", { exact: false })).toBeVisible();
  await expect(page.getByText(/You do not need to download a file/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Download report", exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "Advanced" }).click();
  await expect(page.getByRole("button", { name: "Download report", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete audit", exact: true })).not.toBeVisible();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1100 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`dashboard-${width}.png`), fullPage: true });
  }
  await page.getByRole("button", { name: "Color theme" }).click();
  await page.getByRole("menuitemradio", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: "Download report", exact: true })).toHaveCSS("background-color", "rgb(237, 237, 237)");
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({ path: testInfo.outputPath("dashboard-dark.png"), fullPage: true });
});
