import { expect, test, type Page } from "@playwright/test";
import type { ApiUser, StaffAdvisoryBooking } from "../src/lib/api";

const id = "11111111-1111-4111-8111-111111111111";
const root = "/staff/advisory-bookings";
const staff: ApiUser = { id: "staff-1", displayName: "Test operator", email: null, grokSubject: null, staffRole: "operator" };
const fixture: StaffAdvisoryBooking = {
  id, source: { type: "audit_job", id: "22222222-2222-4222-8222-222222222222" },
  status: "requested", assigneeRef: null, scope: "Review migration rollback", urgency: "urgent",
  preferredWindow: { startAt: "2026-09-25T09:00:00Z", endAt: "2026-09-25T10:00:00Z" },
  notes: "Check the recovery plan.", billing: { billableMinutes: null, feeCents: null, currency: "USD" },
  createdAt: "2026-09-24T09:00:00Z", updatedAt: "2026-09-24T09:00:00Z", history: [],
};

async function account(page: Page, user: ApiUser | null) {
  await page.route("**/api/user", (route) => route.fulfill({ status: user ? 200 : 401, json: user ?? {} }));
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
}

test("unauthenticated and ordinary accounts never fetch staff records or see the staff menu", async ({ page }) => {
  let staffRequests = 0;
  await page.route("**/api/staff/**", (route) => { staffRequests++; return route.fulfill({ status: 403, json: { error: "Staff access required" } }); });
  await account(page, null);
  await page.goto(`${root}/${id}`);
  await expect(page.getByRole("heading", { name: "Sign in to manage bookings" })).toBeVisible();
  await account(page, { ...staff, staffRole: null });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Staff access required" })).toBeVisible();
  await page.getByRole("button", { name: "Review", exact: true }).click();
  await expect(page.getByRole("link", { name: /Advisory bookings/ })).toHaveCount(0);
  expect(staffRequests).toBe(0);
});

test("staff can filter, assign, complete, and bill through the exact API contract", async ({ page }) => {
  await account(page, { ...staff, staffRole: "staff" });
  let booking = structuredClone(fixture);
  const mutations: Array<{ action: string; body: Record<string, unknown> }> = [];
  let csrfRequests = 0;
  await page.route("**/sanctum/csrf-cookie", (route) => { csrfRequests++; return route.fulfill({ status: 204 }); });
  await page.route("**/api/staff/advisory-bookings**", async (route) => {
    const action = new URL(route.request().url()).pathname.split("/").pop()!;
    if (route.request().method() === "PATCH") {
      const body = route.request().postDataJSON();
      mutations.push({ action, body });
      const previous = booking.status;
      booking = { ...booking, ...body, updatedAt: new Date().toISOString() };
      booking.history = [{
        id: String(mutations.length), type: action as "status" | "assignment" | "billing", actorRef: staff.id,
        fromStatus: action === "status" ? previous : null, toStatus: body.status ?? null,
        assigneeRef: body.assigneeRef ?? null, billing: body.billing ?? { billableMinutes: null, feeCents: null, currency: null },
        createdAt: "2026-09-24T10:00:00Z",
      }, ...booking.history];
    }
    await route.fulfill({ json: action === "advisory-bookings" ? { bookings: [booking] } : booking });
  });
  await page.goto(root);
  await expect(page.getByRole("heading", { name: fixture.scope })).toBeVisible();
  await page.getByRole("combobox", { name: "Status", exact: true }).selectOption("completed");
  await expect(page.getByText("No bookings match this status.")).toBeVisible();
  await page.getByRole("combobox", { name: "Status", exact: true }).selectOption("requested");
  await page.getByRole("link", { name: /Review migration rollback/ }).click();
  await expect(page.getByRole("heading", { name: "Booking #11111111" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByLabel("Expert reference")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save billing" })).toHaveCount(0);
  await expect(page.getByLabel("Next status").locator("option")).toHaveText(["Choose a transition", "Accepted", "Cancelled"]);

  await page.getByLabel("Next status").selectOption("accepted");
  await page.getByRole("button", { name: "Change status" }).click();
  await page.getByLabel("Expert reference").fill("expert@example.com");
  await page.getByRole("button", { name: "Save assignment" }).click();
  expect(await page.getByLabel("Expert reference").evaluate((element: HTMLInputElement) => element.validity.patternMismatch)).toBe(true);
  expect(mutations).toHaveLength(1);
  await page.getByLabel("Expert reference").fill("expert:001");
  await page.getByRole("button", { name: "Save assignment" }).click();
  await expect(page.getByText("Assigned to expert:001", { exact: true })).toBeVisible();

  for (const status of ["scheduled", "in_progress", "completed"]) {
    await page.getByLabel("Next status").selectOption(status);
    await page.getByRole("button", { name: "Change status" }).click();
    await expect.poll(() => booking.status).toBe(status);
    await expect(page.getByText("Booking updated.", { exact: true })).toBeVisible();
  }
  await expect(page.getByLabel("Next status")).toHaveCount(0);
  await expect(page.getByLabel("Expert reference")).toHaveCount(0);
  await page.getByLabel("Billable minutes").fill("45");
  await page.getByLabel("Fee (cents)").fill("0");
  await page.getByLabel("Currency").fill("usd");
  await page.getByRole("button", { name: "Save billing" }).click();
  await expect(page.getByText("45 minutes · 0 cents · USD", { exact: true })).toBeVisible();
  expect(mutations.map((mutation) => mutation.action)).toEqual(["status", "assignment", "status", "status", "status", "billing"]);
  expect(mutations.at(-1)?.body).toEqual({ billing: { billableMinutes: 45, feeCents: 0, currency: "USD" } });
  expect(csrfRequests).toBe(6);
  await page.getByRole("link", { name: "Back to bookings" }).click();
  await expect(page.getByRole("link", { name: /Review migration rollback/ })).toContainText("Completed");
});

test("conflicts refresh state and validation errors preserve billing inputs", async ({ page }) => {
  await account(page, staff);
  let booking = structuredClone(fixture);
  await page.route("**/api/staff/advisory-bookings/**", async (route) => {
    if (route.request().method() === "PATCH") {
      if (route.request().url().endsWith("/status")) {
        booking = { ...booking, status: "cancelled" };
        return route.fulfill({ status: 409, json: { error: "Invalid advisory booking status transition" } });
      }
      return route.fulfill({ status: 422, json: { message: "The billing currency field is invalid." } });
    }
    return route.fulfill({ json: booking });
  });
  await page.goto(`${root}/${id}`);
  await page.getByLabel("Next status").selectOption("accepted");
  await page.getByRole("button", { name: "Change status" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Review the refreshed booking");
  await expect(page.getByLabel("Next status")).toHaveCount(0);
  await page.getByLabel("Billable minutes").fill("20");
  await page.getByLabel("Fee (cents)").fill("100");
  await page.getByRole("button", { name: "Save billing" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("The billing currency field is invalid.");
  await expect(page.getByLabel("Billable minutes")).toHaveValue("20");
  await expect(page.getByLabel("Fee (cents)")).toHaveValue("100");
  await expect(page.getByText("Booking updated.", { exact: true })).toHaveCount(0);
});

test("staff revocation during editing hides cached details and controls", async ({ page }) => {
  let revoked = false;
  await page.route("**/api/user", (route) => route.fulfill({ json: { ...staff, staffRole: revoked ? null : "staff" } }));
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/staff/advisory-bookings/**", (route) => {
    if (route.request().method() === "PATCH") {
      revoked = true;
      return route.fulfill({ status: 403, json: { error: "Staff access required" } });
    }
    return route.fulfill({ json: fixture });
  });
  await page.goto(`${root}/${id}`);
  await page.getByLabel("Next status").selectOption("accepted");
  await page.getByRole("button", { name: "Change status" }).click();
  await expect(page.getByRole("heading", { name: "Staff access required" })).toBeVisible();
  await expect(page.getByText(fixture.scope, { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Change status" })).toHaveCount(0);
});

test("staff list handles failures and empty results; missing details are explicit", async ({ page }) => {
  await account(page, staff);
  let attempts = 0;
  await page.route("**/api/staff/advisory-bookings", (route) => {
    attempts++;
    return route.fulfill(attempts === 1 ? { status: 503, json: { error: "Booking service unavailable" } } : { json: { bookings: [] } });
  });
  await page.goto(root);
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Booking service unavailable");
  await page.getByRole("button", { name: "Refresh bookings" }).click();
  await expect(page.getByText("No advisory requests yet.")).toBeVisible();
  await page.route("**/api/staff/advisory-bookings/**", (route) => route.fulfill({ status: 404, json: { error: "Not found" } }));
  await page.goto(`${root}/${id}`);
  await expect(page.getByRole("heading", { name: "Booking not found" })).toBeVisible();
});

test("operator navigation and long booking details fit a narrow screen", async ({ page }) => {
  await account(page, staff);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/staff/advisory-bookings/**", (route) => route.fulfill({ json: { ...fixture, scope: "x".repeat(300), status: "accepted", assigneeRef: "expert:" + "x".repeat(240) } }));
  await page.goto(`${root}/${id}`);
  await expect(page.getByRole("heading", { name: "Booking #11111111" })).toBeVisible();
  await page.getByRole("button", { name: "Review", exact: true }).click();
  await expect(page.getByRole("link", { name: /Advisory bookings/ })).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
