import { expect, test } from "./fixtures";

const sessionId = "00000000-0000-4000-8000-000000000042";
const jobId = "00000000-0000-4000-8000-000000000041";
const reason = "No commit pin is known.";
const finding = {
  id: "finding-main",
  severity: "medium",
  title: "Action ref is a floating branch",
  detail: "A uses value is pinned to @main or @master.",
  resource: "jobs.build.steps.0",
  remediation: "Pin the action to a release tag or a full commit SHA.",
  specialist: "devsecops",
};
const job = {
  id: jobId,
  status: "completed",
  summary: "Workflow review",
  scope: { content: "uses: actions/checkout@main\n" },
  specialists: ["devsecops"],
  findings: [finding],
  steps: [],
};

test.use({ headless: true });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/user", (route) => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route(`**/api/jobs/${jobId}`, (route) => route.fulfill({ json: job }));
});

test("a skipped @main proposal shows the reason text", async ({ page }) => {
  await page.route(`**/api/watchtower/sessions/${sessionId}`, (route) => route.fulfill({
    json: { id: sessionId, jobId, status: "open", participants: [], proposals: [], redirects: [] },
  }));
  await page.route(`**/api/watchtower/sessions/${sessionId}/proposals/generate`, (route) => route.fulfill({
    json: {
      proposals: [],
      skipped: [{ title: finding.title, resource: finding.resource, reason }],
    },
  }));
  await page.route(`**/api/watchtower/sessions/${sessionId}/stream`, (route) => route.fulfill({ status: 204 }));
  await page.goto(`/watchtower/${sessionId}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Generate safe proposals" }).click();
  await expect(page.getByText(reason)).toBeVisible();
  await expect(page.getByText(`Skipped ${finding.title}: ${reason}`)).toBeVisible();
});

test("a closed review keeps generate unavailable and still shows an API skip reason", async ({ page }) => {
  await page.route(`**/api/watchtower/sessions/${sessionId}`, (route) => route.fulfill({
    json: {
      id: sessionId,
      jobId,
      status: "closed",
      participants: [],
      proposals: [],
      redirects: [],
      skipped: [{ title: finding.title, resource: finding.resource, reason }],
    },
  }));
  await page.goto(`/watchtower/${sessionId}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Generate safe proposals" })).toHaveCount(0);
  await expect(page.getByText(`Skipped ${finding.title}: ${reason}`)).toBeVisible();
});
