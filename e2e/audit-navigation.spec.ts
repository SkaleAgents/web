import { expect, test } from "@playwright/test";

test("audit creation and job management use separate pages", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Test Owner", email: "owner@skaleagents.com" } }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: { accountId: "owner", enabled: false } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  let created = false;
  await page.route("**/api/jobs", route => {
    if (route.request().method() === "POST") {
      created = true;
      return route.fulfill({ status: 202, json: { id: "new-job", status: "queued", createdAt: new Date().toISOString() } });
    }
    return route.fulfill({ json: { jobs: created ? [{ id: "new-job", status: "queued", summary: "Review queued", specialists: ["devsecops"], createdAt: new Date().toISOString() }] : [] } });
  });

  await page.goto("/me/jobs");
  await expect(page.getByRole("heading", { name: "Audit jobs", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "IaC content" })).toHaveCount(0);
  await page.getByRole("link", { name: "New audit" }).first().click();
  await expect(page).toHaveURL(/\/me\/jobs\/new$/);
  await page.getByRole("textbox", { name: "IaC content" }).fill('resource "aws_security_group" "ssh" {}');
  await page.getByRole("button", { name: "Queue audit" }).click();
  await expect(page).toHaveURL(/\/me\/jobs$/);
  await expect(page.getByText("Review queued")).toBeVisible();
});

test("signed-in navigation shows the theme control beside an avatar-only account menu", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Test Owner", email: "owner@skaleagents.com" } }));
  await page.goto("/me/jobs");
  const toolbar = page.locator(".dashboard-toolbar");
  await expect(toolbar.getByRole("button", { name: "Color theme" })).toBeVisible();
  const account = toolbar.getByRole("button", { name: "Test Owner, account menu" });
  await expect(account).toBeVisible();
  await expect(account).not.toContainText("Test Owner");
  await toolbar.getByRole("button", { name: "Color theme" }).click();
  const menu = page.getByRole("menu", { name: "Color theme" });
  for (const choice of ["Light", "Dark", "System"]) await expect(menu.getByRole("menuitemradio", { name: choice })).toBeVisible();
  await menu.getByRole("menuitemradio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("class", /dark/);
  await account.click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
});

test("public navigation shows Dashboard only after sign-in", async ({ page }) => {
  let signedIn = false;
  await page.route("**/api/user", route => route.fulfill(signedIn
    ? { json: { id: "owner", displayName: "Test Owner", email: "owner@skaleagents.com" } }
    : { status: 401, json: { message: "Unauthenticated" } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dashboard" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Color theme" })).toBeVisible();

  signedIn = true;
  await page.reload();
  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Test Owner, account menu" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
});

test("audit jobs stay paged as the list grows", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Test Owner" } }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: { accountId: "owner", enabled: false } }));
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: Array.from({ length: 12 }, (_, index) => ({
    id: `job-${index + 1}`, status: "completed", summary: `Audit ${index + 1}`, specialists: ["sre"], createdAt: new Date().toISOString(),
  })) } }));
  await page.goto("/me/jobs");
  await expect(page.getByText("Audit 1", { exact: true })).toBeVisible();
  await expect(page.getByText("Audit 11", { exact: true })).toHaveCount(0);
  await page.getByRole("navigation", { name: "Audit jobs pages" }).getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Audit 11", { exact: true })).toBeVisible();
  await expect(page.getByText("Audit 1", { exact: true })).toHaveCount(0);
});

test("audit history opens one job at a time for review and management", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const id = "00000000-0000-4000-8000-000000000001";
  const job = {
    id, status: "completed", summary: "Ingress review", requestedBy: "owner",
    sourcePurged: false, specialists: ["devsecops"], partial: false, scope: {},
    createdAt: "2026-09-28T12:00:00Z", updatedAt: "2026-09-28T12:00:00Z",
  };
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: { accountId: "owner", enabled: false } }));
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: [job] } }));
  await page.route(`**/api/jobs/${id}`, route => route.fulfill({ json: job }));

  await page.goto("/me/jobs");
  await expect(page.getByText("Ingress review")).toBeVisible();
  await expect(page.getByRole("button", { name: "Export report" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole("link", { name: "View audit" }).click();
  await expect(page).toHaveURL(new RegExp(`/me/jobs/${id}$`));
  await expect(page.getByRole("heading", { name: "Audit details" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Watchtower" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export report" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to audit jobs" })).toHaveAttribute("href", "/me/jobs");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("a guessed audit detail ID stays unavailable without exposing source data", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route("**/api/jobs/unknown", route => route.fulfill({ status: 404, json: { message: "Another account owns private-revision" } }));
  await page.goto("/me/jobs/unknown");
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("This audit is unavailable or has been removed.");
  await expect(page.getByText("private-revision")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Export report" })).toHaveCount(0);
});
