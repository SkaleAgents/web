import { expect, test } from "./fixtures";
import { personalOrganization, personalOrganizationId } from "./personal-organization-fixture";

const id = "0198f0b0-0000-7000-8000-000000000002";
const owner = { id: "slug-owner", displayName: "Owner", email: "owner@example.test" };
const team = { id, slug: "binary-labs", name: "Binary Labs", kind: "team", role: "owner" };
const personal = { ...personalOrganization, slug: "personal-owner" };

test.beforeEach(async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: owner }));
  await page.route("**/api/workspaces**", route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/workspaces") return route.fulfill({ json: { data: [personal, team] } });
    if (path === `/api/workspaces/${id}`) return route.fulfill({ json: { data: team } });
    if (path === `/api/workspaces/${personalOrganizationId}`) return route.fulfill({ json: { data: personal } });
    if (path.endsWith("/members") || path.endsWith("/invitations")) return route.fulfill({ json: { data: [] } });
    return route.fulfill({ status: 404, json: { error: "Unavailable" } });
  });
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: [] } }));
  await page.route("**/api/schedules", route => route.fulfill({ json: { schedules: [] } }));
  await page.route("**/api/bots", route => route.fulfill({ json: { bots: [] } }));
});

test("slug dashboard uses UUID API identity and emits canonical links", async ({ page }) => {
  const wrong: string[] = [];
  page.on("request", request => { if (request.url().includes("/api/workspaces/binary-labs")) wrong.push(request.url()); });
  await page.goto("/org/binary-labs");
  await expect(page.getByRole("heading", { name: "Binary Labs", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Organization settings" })).toHaveAttribute("href", "/org/binary-labs/settings");
  await page.getByRole("link", { name: "Organization settings" }).click();
  await expect(page.getByRole("heading", { name: "Organization settings" })).toBeVisible();
  expect(wrong).toEqual([]);
});

test("old UUID bookmark preserves suffix query and fragment", async ({ page }) => {
  await page.goto(`/org/${id}/settings?tab=members#details`);
  await expect(page).toHaveURL("/org/binary-labs/settings?tab=members#details");
  await expect(page.getByRole("heading", { name: "Organization settings" })).toBeVisible();
});

test("personal login and organization switcher use slugs", async ({ page }) => {
  await page.goto("/login?next=%2Fdashboard%2Fjobs");
  await expect(page).toHaveURL("/org/personal-owner/jobs");
  await page.getByRole("button", { name: "Personal, switch scope" }).click();
  await expect(page.getByRole("link", { name: "Binary Labs", exact: true })).toHaveAttribute("href", "/org/binary-labs/jobs");
});

test("unknown and revoked slugs do not mount organization data", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => { if (request.url().includes("/api/workspaces/")) requests.push(request.url()); });
  await page.goto("/org/not-a-member/settings");
  await expect(page.locator("main[role=alert]")).toContainText("Organization unavailable");
  expect(requests).toEqual([]);
  await page.route(`**/api/workspaces/${id}`, route => route.fulfill({ status: 404, json: { error: "Unavailable" } }));
  await page.goto("/org/binary-labs/settings");
  await expect(page.locator("main[role=alert]")).toContainText("Organization unavailable");
  await expect(page.getByRole("heading", { name: "Organization settings" })).toHaveCount(0);
});

for (const [pagePath, apiPath] of [
  ['billing', 'billing'], ['settings/retention', 'retention'], ['settings/cutover-notice', 'cutover-notice'],
]) {
  test(`slug ${pagePath} uses the resolved UUID`, async ({ page }) => {
    const seen: string[] = [];
    page.on('request', request => { seen.push(new URL(request.url()).pathname); });
    await page.goto(`/org/binary-labs/${pagePath}`);
    await expect.poll(() => seen.includes(`/api/workspaces/${id}/${apiPath}`)).toBe(true);
    expect(seen.some(path => path.startsWith('/api/workspaces/binary-labs'))).toBe(false);
  });
}

for (const section of ['jobs', 'schedules']) {
  test(`enabled shared ${section} resolve slug before API requests`, async ({ page }) => {
    test.skip(process.env.WORKSPACE_AUDIT_TEST_MODE !== 'enabled', 'Requires feature-on build');
    const seen: string[] = [];
    page.on('request', request => { seen.push(new URL(request.url()).pathname); });
    await page.goto(`/org/binary-labs/${section}`);
    await expect.poll(() => seen.includes(`/api/workspaces/${id}/${section}`)).toBe(true);
    expect(seen.some(path => path.startsWith('/api/workspaces/binary-labs'))).toBe(false);
  });
}


test("switching slugs clears the previous organization before access resolves", async ({ page }) => {
  const second = { ...team, id: "0198f0b0-0000-7000-8000-000000000003", slug: "other-team", name: "Other Team" };
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: [personal, team, second] } }));
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(`**/api/workspaces/${second.id}`, async route => {
    await gate;
    await route.fulfill({ json: { data: second } });
  });
  await page.goto("/org/binary-labs");
  await expect(page.getByRole("heading", { name: "Binary Labs", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Binary Labs, switch scope" }).click();
  await page.getByRole("link", { name: "Other Team", exact: true }).click();
  await expect(page).toHaveURL("/org/other-team");
  await expect(page.getByRole("status")).toContainText("Checking organization access");
  await expect(page.getByRole("heading", { name: "Binary Labs", exact: true })).toHaveCount(0);
  release();
  await expect(page.getByRole("heading", { name: "Other Team", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Organization settings" })).toHaveAttribute("href", "/org/other-team/settings");
});

test("warm settings cache stays hidden after same-organization access is revoked", async ({ page }) => {
  let revoked = false;
  let checksAfterRevocation = 0;
  await page.route(`**/api/workspaces/${id}`, route => {
    if (revoked) checksAfterRevocation++;
    return route.fulfill(revoked ? { status: 404, json: { error: "Unavailable" } } : { json: { data: team } });
  });
  await page.route(`**/api/workspaces/${id}/members`, route => route.fulfill({ json: { data: [
    { userId: "member-a", email: "sensitive@example.test", name: "Private Member", role: "member", joinedAt: "2026-09-30T00:00:00Z" },
  ] } }));
  await page.goto("/org/binary-labs/settings");
  await expect(page.getByText("sensitive@example.test", { exact: true })).toBeVisible();
  await page.locator('.dashboard-brand a').click();
  await expect(page).toHaveURL("/org/binary-labs");
  await expect(page.getByRole("heading", { name: "Binary Labs", exact: true })).toBeVisible();
  revoked = true;
  await page.getByRole("link", { name: "Organization settings" }).click();
  await expect(page).toHaveURL("/org/binary-labs/settings");
  await expect(page.locator("main[role=alert]")).toContainText("Organization unavailable");
  await expect(page.getByText("sensitive@example.test", { exact: true })).toHaveCount(0);
  expect(checksAfterRevocation).toBeGreaterThan(0);
});

test("navigation keeps the dashboard frame while access loads only inside content", async ({ page }) => {
  let hold = false;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(`**/api/workspaces/${id}`, async route => {
    if (hold) await gate;
    await route.fulfill({ json: { data: team } });
  });
  await page.goto("/org/binary-labs");
  await expect(page.getByRole("heading", { name: "Binary Labs", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
  hold = true;
  await page.getByRole("link", { name: "Organization settings" }).click();
  await expect(page).toHaveURL("/org/binary-labs/settings");
  await expect(page.locator('.dashboard-content [role=status]')).toContainText("Checking organization access");
  await expect(page.getByRole("navigation", { name: "Dashboard navigation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Expand sidebar", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Binary Labs, switch scope" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Binary Labs", exact: true })).toHaveCount(0);
  release();
  await expect(page.getByRole("heading", { name: "Organization settings", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Expand sidebar", exact: true })).toBeVisible();
});
