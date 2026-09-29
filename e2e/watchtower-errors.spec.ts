import { expect, test } from "./fixtures";

const sessionId = "00000000-0000-4000-8000-000000000002";
const jobId = "00000000-0000-4000-8000-000000000001";
const session = { id: sessionId, jobId, status: "closed", participants: [], proposals: [], redirects: [] };
const job = { id: jobId, status: "completed", summary: "Recovered audit", scope: {}, specialists: ["sre"], findings: [], steps: [] };

test.beforeEach(async ({ page }) => {
  await page.route("**/api/user", (route) => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
});

for (const status of [403, 404, 503]) {
  test(`Watchtower displays a session ${status} instead of waiting for a disabled job query`, async ({ page }) => {
    let jobRequests = 0;
    await page.route(`**/api/watchtower/sessions/${sessionId}`, (route) => route.fulfill({ status, json: { message: `Session request failed (${status})` } }));
    await page.route(`**/api/jobs/${jobId}`, (route) => {
      jobRequests++;
      return route.fulfill({ json: job });
    });
    await page.goto(`/watchtower/${sessionId}`);
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(`Session request failed (${status})`);
    await expect(page.getByText("Loading Watchtower…", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Try again" })).toBeEnabled();
    await expect(page.getByRole("link", { name: "Back to audits" })).toHaveAttribute("href", "/org/0198f0b0-0000-7000-8000-000000000001/jobs");
    expect(jobRequests).toBe(0);
  });
}

test("retrying a failed session loads its dependent job", async ({ page }) => {
  let available = false;
  await page.route(`**/api/watchtower/sessions/${sessionId}`, (route) => route.fulfill(available ? { json: session } : { status: 503, json: { message: "Session unavailable" } }));
  await page.route(`**/api/jobs/${jobId}`, (route) => route.fulfill({ json: job }));
  await page.goto(`/watchtower/${sessionId}`);
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Session unavailable");
  available = true;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Live audit session" })).toBeVisible();
  await expect(page.getByText("Recovered audit", { exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
});

test("retrying a failed job preserves the successful session", async ({ page }) => {
  let available = false;
  let sessionRequests = 0;
  await page.route(`**/api/watchtower/sessions/${sessionId}`, (route) => {
    sessionRequests++;
    return route.fulfill({ json: session });
  });
  await page.route(`**/api/jobs/${jobId}`, (route) => route.fulfill(available ? { json: job } : { status: 403, json: { message: "Job access denied" } }));
  await page.goto(`/watchtower/${sessionId}`);
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Job access denied");
  const requestsBeforeRetry = sessionRequests;
  available = true;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Live audit session" })).toBeVisible();
  expect(sessionRequests).toBe(requestsBeforeRetry);
});
