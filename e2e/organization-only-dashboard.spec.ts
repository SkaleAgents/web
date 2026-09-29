import { expect, test } from "./fixtures";

const personal = "0198f0b0-0000-7000-8000-000000000001";
const team = "0198f0b0-0000-7000-8000-000000000002";
const user = { id: "dashboard-owner", displayName: "Dashboard Owner", email: "owner@example.com", agreementRequired: false };
const memberships = [
  { id: personal, name: "Personal", kind: "personal", role: "owner", createdAt: "2026-09-29T00:00:00Z" },
  { id: team, name: "Platform Team", kind: "team", role: "owner", createdAt: "2026-09-29T00:00:00Z" },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: user }));
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: memberships } }));
  await page.route(`**/api/workspaces/${personal}`, route => route.fulfill({ json: { data: memberships[0] } }));
  await page.route(`**/api/workspaces/${team}`, route => route.fulfill({ json: { data: memberships[1] } }));
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: [] } }));
  await page.route("**/api/schedules", route => route.fulfill({ json: { schedules: [] } }));
  await page.route("**/api/bots", route => route.fulfill({ json: { bots: [] } }));
});

test("legacy personal job links resolve to the personal organization", async ({ page }) => {
  await page.goto("/me/jobs");
  await expect(page).toHaveURL(`/org/${personal}/jobs`);
  await expect(page.getByRole("heading", { name: "Audit jobs" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Personal, switch scope/ })).toBeVisible();
});

test("switcher lists Personal once and keeps team URLs distinct", async ({ page }) => {
  await page.goto(`/org/${personal}`);
  await page.getByRole("button", { name: /Personal, switch scope/ }).click();
  await expect(page.getByRole("link", { name: "Personal", exact: true })).toHaveCount(1);
  await page.getByRole("link", { name: "Platform Team", exact: true }).click();
  await expect(page).toHaveURL(`/org/${team}`);
  await expect(page.getByRole("heading", { name: "Platform Team" })).toBeVisible();
});

test("unknown organization cannot mount personal jobs", async ({ page }) => {
  const unknown = "0198f0b0-0000-7000-8000-000000000003";
  let personalJobs = 0;
  await page.route("**/api/jobs", route => { personalJobs++; return route.fulfill({ json: { jobs: [] } }); });
  await page.goto(`/org/${unknown}/jobs`);
  await expect(page.locator('main[role="alert"]')).toContainText("Organization unavailable");
  expect(personalJobs).toBe(0);
});

test("a revoked team cannot mount cached team content", async ({ page }) => {
  let teamJobs = 0;
  await page.route(`**/api/workspaces/${team}`, route => route.fulfill({ status: 404, json: {} }));
  await page.route(`**/api/workspaces/${team}/jobs`, route => { teamJobs++; return route.fulfill({ json: { jobs: [] } }); });
  await page.goto(`/org/${team}/jobs`);
  await expect(page.locator('main[role="alert"]')).toContainText("Organization unavailable");
  expect(teamJobs).toBe(0);
});
