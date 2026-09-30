import { expect, test } from "./fixtures";
import { personalOrganization, personalOrganizationId } from "./personal-organization-fixture";

const org = "0198f0b0-0000-7000-8000-000000000002";
const team = { id: org, name: "Platform Team", kind: "team", role: "owner", createdAt: "2026-09-29T00:00:00Z" };
const owner = { id: "account-1", displayName: "Harun", email: "owner@example.com" };

test("personal home has its own shareable URL", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: owner }));
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: [] } }));
  await page.route("**/api/schedules", route => route.fulfill({ json: { schedules: [] } }));
  await page.route("**/api/bots", route => route.fulfill({ json: { bots: [] } }));
  await page.goto("/me");
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page).toHaveURL(`/org/${personalOrganizationId}`);
});

test("organization audits keep organization in URL", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: owner }));
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: [personalOrganization, team] } }));
  await page.route(`**/api/workspaces/${org}`, route => route.fulfill({ json: { data: team } }));
  await page.route(`**/api/workspaces/${org}/jobs`, route => route.fulfill({ json: { jobs: [] } }));
  await page.goto(`/org/${org}/jobs`);
  await expect(page.getByRole("heading", { name: "Shared audits" })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/org/${org}/jobs$`));
});

test("switcher names the organization and sidebar groups can collapse", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: owner }));
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: [] } }));
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: [personalOrganization, team] } }));
  await page.route(`**/api/workspaces/${org}`, route => route.fulfill({ json: { data: team } }));
  await page.route(`**/api/workspaces/${org}/jobs`, route => route.fulfill({ json: { jobs: [] } }));
  await page.goto("/me/jobs");
  await page.getByRole("button", { name: "Personal, switch scope" }).click();
  await page.getByRole("link", { name: "Platform Team" }).click();
  await expect(page).toHaveURL(new RegExp(`/org/${org}/jobs$`));
  await expect(page.getByRole("banner")).toContainText("Platform Team / Audit jobs");
  const navigation = page.getByRole("navigation", { name: "Dashboard navigation" });
  const group = navigation.getByRole("button", { name: "Your work" });
  await expect(group).toHaveAttribute("aria-expanded", "true");
  await group.click();
  await expect(group).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("banner").getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(page.getByRole("banner").getByRole("button", { name: "Expand sidebar" })).toBeVisible();
});

test("legacy dashboard links redirect to the right scope", async ({ request }) => {
  const personal = await request.get("/dashboard/jobs", { maxRedirects: 0 });
  expect(personal.status()).toBe(200);

  const organization = await request.get(`/dashboard/workspaces/${org}/jobs`, { maxRedirects: 0 });
  expect(organization.status()).toBe(307);
  expect(organization.headers().location).toBe(`/org/${org}/jobs`);

  const billing = await request.get(`/dashboard/billing?checkout=return&organization=${org}`, { maxRedirects: 0 });
  expect(billing.status()).toBe(307);
  expect(billing.headers().location).toContain(`/org/${org}/billing`);
  expect(billing.headers().location).toContain("checkout=return");
});

test("organization overview and settings keep their scope", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: owner }));
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: [personalOrganization, team] } }));
  await page.route(`**/api/workspaces/${org}`, route => route.fulfill({ json: { data: team } }));
  await page.goto(`/org/${org}`);
  await expect(page.getByRole("heading", { name: "Platform Team" })).toBeVisible();
  await page.getByRole("link", { name: "Organization settings" }).click();
  await expect(page).toHaveURL(new RegExp(`/org/${org}/settings$`));
  await expect(page.getByRole("heading", { name: "Organization settings" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Audit retention notice" })).toHaveAttribute("href", `/org/${org}/settings/retention`);
});

test("personal organizations page stays under personal scope", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: owner }));
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: [personalOrganization, team] } }));
  await page.goto("/me/organizations");
  await expect(page.getByRole("heading", { name: "Organizations" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Platform Team" })).toHaveAttribute("href", `/org/${org}`);
});

test("organization billing opens directly at its scoped URL", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: owner }));
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: [personalOrganization, team] } }));
  await page.route(`**/api/workspaces/${org}`, route => route.fulfill({ json: { data: team } }));
  await page.route("**/api/organization-plans", route => route.fulfill({ json: { data: [{ key: "free", name: "Free", monthlyUsd: 0, auditLimit: 2, checkoutMode: "included" }] } }));
  await page.route(`**/api/workspaces/${org}/billing`, route => route.fulfill({ json: {
    plan: "free", usage: { used: 0, limit: 2, remaining: 2, periodEnd: "2026-10-01T00:00:00Z" },
    pendingChange: null, renewalPayment: null, testModeEnabled: false, cancellationEnabled: false,
  } }));
  await page.goto(`/org/${org}/billing`);
  await expect(page.getByRole("heading", { name: "Organization billing" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Current plan" })).toContainText("Free");
  await expect(page.getByRole("banner")).toContainText("Platform Team / Billing");
});

test("switching organizations keeps the section and drops a foreign detail ID", async ({ page }) => {
  const second = "0198f0b0-0000-7000-8000-000000000003";
  await page.route("**/api/user", route => route.fulfill({ json: owner }));
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: [
    personalOrganization,
    team,
    { id: second, name: "Research Team", kind: "team", role: "member" },
  ] } }));
  await page.route(`**/api/workspaces/${org}`, route => route.fulfill({ json: { data: team } }));
  await page.route(`**/api/workspaces/${second}`, route => route.fulfill({ json: { data: { id: second, name: "Research Team", kind: "team", role: "member" } } }));
  await page.route(`**/api/workspaces/${org}/jobs`, route => route.fulfill({ json: { jobs: [] } }));
  await page.route(`**/api/workspaces/${second}/jobs`, route => route.fulfill({ json: { jobs: [] } }));
  await page.goto(`/org/${org}/jobs`);
  await page.getByRole("button", { name: "Platform Team, switch scope" }).click();
  await page.getByRole("link", { name: "Research Team" }).click();
  await expect(page).toHaveURL(new RegExp(`/org/${second}/jobs$`));
  await expect(page.getByRole("banner")).toContainText("Research Team / Audit jobs");
});

test("a revoked organization deep link shows no private content", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: owner }));
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: [] } }));
  let privateRequests = 0;
  await page.route(`**/api/workspaces/${org}/jobs`, route => { privateRequests++; return route.fulfill({ json: { jobs: [] } }); });
  await page.goto(`/org/${org}/jobs`);
  await expect(page.locator("main[role=alert]")).toContainText("Organization unavailable");
  expect(privateRequests).toBe(0);
});
