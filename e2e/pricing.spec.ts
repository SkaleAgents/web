import { expect, test } from "./fixtures";

test("shows five plans and records an Enterprise inquiry", async ({ page }) => {
  await page.route("**/api/organization-plans", async (route) => route.fulfill({ json: { data: [
    { key: "free", name: "Free", monthlyUsd: 0, auditLimit: 2, scheduleLimit: 0, minimumIntervalHours: null, recommended: false, checkoutMode: "included" },
    { key: "starter", name: "Starter", monthlyUsd: 19, auditLimit: 25, scheduleLimit: 1, minimumIntervalHours: 48, recommended: false, checkoutMode: "self_service" },
    { key: "pro", name: "Pro", monthlyUsd: 49, auditLimit: 200, scheduleLimit: 10, minimumIntervalHours: 24, recommended: true, checkoutMode: "self_service" },
    { key: "max", name: "Max", monthlyUsd: 499, auditLimit: 2000, scheduleLimit: 100, minimumIntervalHours: 1, recommended: false, checkoutMode: "self_service" },
    { key: "enterprise", name: "Enterprise", monthlyUsd: null, auditLimit: null, scheduleLimit: null, minimumIntervalHours: null, recommended: false, checkoutMode: "contact" },
  ] } }));
  await page.route("**/sanctum/csrf-cookie", async (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/enterprise-inquiries", async (route) => route.fulfill({ status: 201, json: { id: "inquiry-1", status: "received" } }));
  await page.goto("/pricing");
  await expect(page.getByRole("note")).toContainText("organization plans");
  await expect(page.getByRole("note")).toContainText("Organization audits start 17 October 2026 at 00:00 UTC.");
  await expect(page.getByText("Recommended")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(5);
  await expect(page.getByText("/ 05")).toHaveCount(0);
  await expect(page.getByText("Enrollment coming soon")).toHaveCount(3);
  await page.getByRole("button", { name: "Contact us" }).click();
  await page.getByLabel("Organization name").fill("Example Org");
  await page.getByLabel("Contact name").fill("Alex");
  await page.getByLabel("Email").fill("alex@example.com");
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByText("Inquiry received")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("article")).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("paid plans link to billing when enrollment is open", async ({ page }) => {
  await page.route("**/api/organization-plans", async (route) => route.fulfill({ json: { enrollmentOpen: true, data: [
    { key: "free", name: "Free", monthlyUsd: 0, auditLimit: 2, scheduleLimit: 0, minimumIntervalHours: null, recommended: false, checkoutMode: "included" },
    { key: "starter", name: "Starter", monthlyUsd: 19, auditLimit: 25, scheduleLimit: 1, minimumIntervalHours: 48, recommended: false, checkoutMode: "self_service" },
    { key: "pro", name: "Pro", monthlyUsd: 49, auditLimit: 200, scheduleLimit: 10, minimumIntervalHours: 24, recommended: true, checkoutMode: "self_service" },
    { key: "max", name: "Max", monthlyUsd: 499, auditLimit: 2000, scheduleLimit: 100, minimumIntervalHours: 1, recommended: false, checkoutMode: "self_service" },
    { key: "enterprise", name: "Enterprise", monthlyUsd: null, auditLimit: null, scheduleLimit: null, minimumIntervalHours: null, recommended: false, checkoutMode: "contact" },
  ] } }));
  await page.goto("/pricing");
  await expect(page.getByRole("link", { name: "Choose Starter" })).toHaveAttribute("href", "/me/billing");
  await expect(page.getByRole("link", { name: "Choose Pro" })).toHaveAttribute("href", "/me/billing");
  await expect(page.getByRole("link", { name: "Choose Max" })).toHaveAttribute("href", "/me/billing");
  await expect(page.getByText("Enrollment coming soon")).toHaveCount(0);
});
