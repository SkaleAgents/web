import { expect, test } from "./fixtures";

const user = { id: "agreement-owner", displayName: "Agreement Owner", email: "owner@example.com", agreementRequired: true };
const status = { termsVersion: "2026-09-29", privacyVersion: "2026-09-29", required: true };

test("requires an explicit checkbox before submitting current policies", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: user }));
  await page.route("**/api/account/agreements", route => route.fulfill({ json: status }));
  await page.goto("/auth/agreements");
  await expect(page.getByRole("checkbox", { name: /Terms of Service/ })).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
  await expect(page.getByRole("main").getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
  await expect(page.getByRole("main").getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
});

test("keeps the agreement visible after a failed submission", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: user }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/account/agreements", route => route.fulfill(route.request().method() === "POST"
    ? { status: 503, json: { error: "Try again" } }
    : { json: status }));
  await page.goto("/auth/agreements");
  await page.getByRole("checkbox", { name: /Terms of Service/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /Terms of Service/ })).toBeChecked();
  await expect(page).toHaveURL(/\/auth\/agreements$/);
});

test("saves current versions and resumes a personal organization destination", async ({ page }) => {
  const personal = "0198f0b0-0000-7000-8000-000000000001";
  await page.route("**/api/user", route => route.fulfill({ json: user }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: [{ id: personal, name: "Personal", kind: "personal", role: "owner" }] } }));
  await page.route(`**/api/workspaces/${personal}`, route => route.fulfill({ json: { data: { id: personal, name: "Personal", kind: "personal", role: "owner" } } }));
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: [] } }));
  let accepted = false;
  await page.route("**/api/account/agreements", async route => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      expect(body).toEqual({ accepted: true, termsVersion: status.termsVersion, privacyVersion: status.privacyVersion });
      accepted = true;
      return route.fulfill({ json: { ...status, required: false } });
    }
    return route.fulfill({ json: status });
  });
  await page.goto("/auth/agreements?next=%2Fme%2Fjobs");
  await page.getByRole("checkbox", { name: /Terms of Service/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(`/org/${personal}/jobs`);
  expect(accepted).toBe(true);
});
