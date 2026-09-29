import { expect, test, type Page } from "@playwright/test";
import type { ApiUser, ConsultancyBooking, ConsultancyPackage } from "../src/lib/api";

const id = "11111111-1111-4111-8111-111111111111";
const slot = "2026-10-08T15:00:00Z";
const customer: ApiUser = { id: "customer-1", displayName: "Booking customer", email: "customer@example.test", grokSubject: null, staffRole: null };
const staff: ApiUser = { ...customer, id: "staff-1", displayName: "Test operator", staffRole: "operator" };
const packages: ConsultancyPackage[] = [
  { slug: "light", name: "Light", durationMinutes: 30, priceCents: 14900, currency: "USD", features: ["Focused review"] },
  { slug: "pro", name: "Pro", durationMinutes: 60, priceCents: 24900, currency: "USD", features: ["Deeper review"] },
  { slug: "max", name: "Max", durationMinutes: 60, priceCents: 34900, currency: "USD", features: ["Plan and follow-up"] },
];
const booking: ConsultancyBooking = {
  id, version: 1, status: "requested", paymentStatus: "unpaid", package: packages[0],
  requestedWindow: { startAt: slot, endAt: "2026-10-08T15:30:00Z" },
  approvedWindow: null, proposedWindow: null, scope: "Review public ingress", notes: null, source: null,
  termsVersion: null, approvedAt: null, paidAt: null, confirmedAt: null, meetingUrl: null,
  cancelledAt: null, refundStatus: null, refundedAt: null, deliveredAt: null,
  createdAt: "2026-09-29T10:00:00Z", updatedAt: "2026-09-29T10:00:00Z",
};

async function login(page: Page, user: ApiUser | null) {
  await page.route("**/api/user", route => route.fulfill({ status: user ? 200 : 401, json: user ?? {} }));
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: [] } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
}

test("sign-in return preserves consultancy destination without fetching private data", async ({ page }) => {
  test.skip(process.env.NEXT_PUBLIC_CONSULTANCY_BOOKING_ENABLED !== "true");
  let privateRequests = 0;
  await login(page, null);
  await page.route("**/api/consultancy/**", route => {
    privateRequests++;
    return route.fulfill({ status: 401, json: {} });
  });
  await page.goto("/me/consultancy");
  await expect(page).toHaveURL(/\/login\?next=%2Fme%2Fconsultancy/);
  expect(privateRequests).toBe(0);
});

test("customer requests a time, sees approval gate, and cannot open another account's booking", async ({ page }) => {
  test.skip(process.env.NEXT_PUBLIC_CONSULTANCY_BOOKING_ENABLED !== "true");
  await login(page, customer);
  let current = structuredClone(booking);
  let submitted: Record<string, unknown> | null = null;
  await page.route("**/api/consultancy/packages", route => route.fulfill({ json: { packages } }));
  await page.route("**/api/consultancy/availability?**", route => route.fulfill({ json: { slots: [slot], timezone: "UTC" } }));
  await page.route("**/api/consultancy/bookings", async route => {
    if (route.request().method() === "POST") {
      submitted = route.request().postDataJSON();
      expect(route.request().headers()["idempotency-key"]).toBeTruthy();
      current = { ...current, ...submitted } as ConsultancyBooking;
      return route.fulfill({ status: 201, json: current });
    }
    return route.fulfill({ json: { bookings: submitted ? [current] : [] } });
  });
  await page.route(`**/api/consultancy/bookings/${id}`, route => route.fulfill({ json: current }));
  await page.route("**/api/consultancy/bookings/22222222-2222-4222-8222-222222222222", route => route.fulfill({ status: 404, json: {} }));
  await page.goto("/me/consultancy");
  await expect(page.getByRole("heading", { name: "Consultancy with Harun" })).toBeVisible();
  await expect(page.getByText("Light · $149")).toBeVisible();
  await expect(page.getByText("Pro · $249")).toBeVisible();
  await expect(page.getByText("Max · $349")).toBeVisible();
  await page.getByLabel(/Available time in/).selectOption(slot);
  await page.getByLabel("What should Harun review?").fill("Review public ingress");
  await page.getByRole("button", { name: "Request this time" }).click();
  await expect(page).toHaveURL(new RegExp(`/me/consultancy/${id}`));
  await expect(page.getByRole("heading", { name: "Waiting for approval" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pay for booking" })).toHaveCount(0);
  expect(submitted).toEqual({ package: "light", startAt: slot, scope: "Review public ingress", notes: null });
  await page.goto("/me/consultancy/22222222-2222-4222-8222-222222222222");
  await expect(page.getByRole("heading", { name: "Booking unavailable" })).toBeVisible();
  await expect(page.getByText("Review public ingress")).toHaveCount(0);
});

test("staff approves before customer can pay and checkout return stays pending", async ({ page }) => {
  test.skip(process.env.NEXT_PUBLIC_CONSULTANCY_BOOKING_ENABLED !== "true");
  await login(page, staff);
  let current = structuredClone(booking);
  await page.route("**/api/staff/consultancy/bookings", route => route.fulfill({ json: { bookings: [current] } }));
  await page.route(`**/api/staff/consultancy/bookings/${id}/approve`, route => {
    expect(route.request().headers()["if-match"]).toBe("1");
    current = { ...current, version: 2, status: "approved_awaiting_payment", approvedWindow: current.requestedWindow };
    return route.fulfill({ json: current });
  });
  await page.route(`**/api/consultancy/bookings/${id}`, route => route.fulfill({ json: current }));
  await page.goto("/staff/consultancy");
  await expect(page.getByRole("heading", { name: "Consultancy requests" })).toBeVisible();
  await page.getByRole("button", { name: "Approve slot" }).click();
  await expect(page.getByText("approved awaiting payment")).toBeVisible();
  await page.goto(`/me/consultancy/${id}?checkout=return`);
  await expect(page.getByRole("heading", { name: "Payment pending" })).toBeVisible();
  await expect(page.getByText(/Returning from Stripe does not confirm payment/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Pay for booking" })).toBeVisible();
});

test("ordinary customers cannot see the staff queue and mobile navigation reaches bookings", async ({ page }) => {
  test.skip(process.env.NEXT_PUBLIC_CONSULTANCY_BOOKING_ENABLED !== "true");
  await login(page, customer);
  await page.setViewportSize({ width: 390, height: 844 });
  let staffRequests = 0;
  await page.route("**/api/staff/consultancy/**", route => {
    staffRequests++;
    return route.fulfill({ status: 403, json: {} });
  });
  await page.route("**/api/consultancy/packages", route => route.fulfill({ json: { packages } }));
  await page.route("**/api/consultancy/availability?**", route => route.fulfill({ json: { slots: [slot], timezone: "UTC" } }));
  await page.route("**/api/consultancy/bookings", route => route.fulfill({ json: { bookings: [] } }));
  await page.goto("/staff/consultancy");
  await expect(page.getByRole("heading", { name: "Staff access required" })).toBeVisible();
  expect(staffRequests).toBe(0);
  await page.goto("/me");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("navigation", { name: "Dashboard navigation" }).getByRole("button", { name: "Consultancy" }).click();
  await page.getByRole("navigation", { name: "Dashboard navigation" }).getByRole("link", { name: "My bookings" }).click();
  await expect(page.getByRole("heading", { name: "Consultancy with Harun" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
