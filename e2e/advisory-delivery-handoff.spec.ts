import { expect, test, type Page } from "./fixtures";

const id = "33333333-3333-4333-8333-333333333333";
const staff = { id: "staff-delivery", displayName: "Test operator", email: null, grokSubject: null, staffRole: "operator" };
const customer = { id: "customer-owner", displayName: "Booking owner", email: null, grokSubject: null };
const appointment = {
  confirmedWindow: { startAt: "2026-09-29T16:00:00Z", endAt: "2026-09-29T17:00:00Z", timezone: "America/Los_Angeles" },
  confirmedAt: "2026-09-25T18:00:00Z",
};

function initialBooking() {
  return {
    id,
    version: 1,
    source: { type: "audit_job", id: "44444444-4444-4444-8444-444444444444" },
    status: "accepted",
    assigneeRef: "expert:opaque-1",
    scope: "Review migration rollback",
    urgency: "soon",
    preferredWindow: { startAt: "2026-09-28T16:00:00Z", endAt: "2026-09-28T17:00:00Z" },
    notes: null,
    billing: { billableMinutes: null, feeCents: null, currency: "USD" },
    agreement: null as null | { id: string; version: number; scope: string; currency: "USD"; quotedFeeCents: number; minimumBillableMinutes: number; incrementMinutes: number; rateCentsPerHour: number; cancellationTermsVersion: string; offeredAt: string; acceptedAt: string | null },
    appointment: null as null | typeof appointment,
    delivery: null as null | { ownerRef: string; contact: { name: string; channel: string; value: string }; handoffStatus: "pending" | "ready"; handedOffAt: string | null },
    createdAt: "2026-09-25T15:00:00Z",
    updatedAt: "2026-09-25T16:00:00Z",
    history: [],
  };
}

async function loginAs(page: Page, role: "staff" | "customer") {
  const user = role === "staff" ? staff : customer;
  await page.route("**/api/user", (route) => route.fulfill({ json: user }));
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
}

test("agreement acceptance, appointment, and two-step delivery handoff gate work start", async ({ page, context }) => {
  test.skip(process.env.NEXT_PUBLIC_ADVISORY_AGREEMENTS_ENABLED !== "true" || process.env.NEXT_PUBLIC_ADVISORY_DELIVERY_HANDOFFS_ENABLED !== "true");

  let booking = initialBooking();
  let staffMode = true;
  let staleOnce = true;
  const deliveryBodies: Array<Record<string, unknown>> = [];
  await page.route("**/api/user", (route) => route.fulfill({ json: staffMode ? staff : customer }));
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route(`**/api/advisory-bookings/${id}`, (route) => {
    if (!staffMode && booking.id !== id) return route.fulfill({ status: 404, json: { error: "Not found" } });
    return route.fulfill({ json: booking });
  });
  await page.route(`**/api/advisory-bookings/${id}/agreement/accept`, async (route) => {
    expect(route.request().headers()["if-match"]).toBe(String(booking.version));
    booking = { ...booking, version: booking.version + 1, agreement: { ...booking.agreement!, acceptedAt: "2026-09-25T18:00:00Z" } };
    await route.fulfill({ json: booking });
  });
  await page.route(`**/api/staff/advisory-bookings/${id}**`, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() !== "PATCH") return route.fulfill({ json: booking });
    const action = path.split("/").pop();
    const body = route.request().postDataJSON() as Record<string, unknown>;
    expect(route.request().headers()["if-match"]).toBe(String(booking.version));
    if (action === "agreement") {
      booking = { ...booking, version: booking.version + 1, agreement: { id: "agreement-1", version: 1, scope: String(body.scope), currency: "USD", quotedFeeCents: Number(body.quotedFeeCents), minimumBillableMinutes: 60, incrementMinutes: 15, rateCentsPerHour: 25000, cancellationTermsVersion: "paid-pilot-v1", offeredAt: "2026-09-25T17:00:00Z", acceptedAt: null } };
    } else if (action === "appointment") {
      booking = { ...booking, version: booking.version + 1, appointment };
    } else if (action === "status") {
      booking = { ...booking, version: booking.version + 1, status: String(body.status) };
    } else if (action === "delivery") {
      deliveryBodies.push(body);
      if (staleOnce) {
        staleOnce = false;
        booking = { ...booking, version: booking.version + 1 };
        return route.fulfill({ status: 409, json: { error: "Stale booking", booking } });
      }
      const contactVerified = body.contactVerified === true;
      const old = booking.delivery;
      const detailsChanged = !old || old.ownerRef !== body.ownerRef || JSON.stringify(old.contact) !== JSON.stringify(body.contact);
      booking = {
        ...booking,
        version: booking.version + (detailsChanged || contactVerified || old?.handoffStatus === "ready" ? 1 : 0),
        delivery: {
          ownerRef: String(body.ownerRef),
          contact: body.contact as { name: string; channel: string; value: string },
          handoffStatus: detailsChanged || !contactVerified ? "pending" : "ready",
          handedOffAt: !detailsChanged && contactVerified ? "2026-09-25T18:30:00Z" : null,
        },
      };
    }
    await route.fulfill({ json: booking });
  });

  await page.goto(`/staff/advisory-bookings/${id}`);
  await page.getByLabel("Exact scope").fill("Review rollback safeguards");
  await page.getByLabel("Written estimate (USD)").fill("312.50");
  await page.getByRole("button", { name: "Offer new version" }).click();
  await expect(page.getByText(/Customer acceptance is still required/)).toBeVisible();

  const customerPage = await context.newPage();
  staffMode = false;
  await loginAs(customerPage, "customer");
  await customerPage.route(`**/api/advisory-bookings/${id}`, (route) => route.fulfill({ json: booking }));
  await customerPage.route(`**/api/advisory-bookings/${id}/agreement/accept`, async (route) => {
    expect(route.request().headers()["if-match"]).toBe(String(booking.version));
    booking = { ...booking, version: booking.version + 1, agreement: { ...booking.agreement!, acceptedAt: "2026-09-25T18:00:00Z" } };
    await route.fulfill({ json: booking });
  });
  await customerPage.goto(`/advisory-bookings/${id}`);
  await expect(customerPage.getByRole("heading", { name: "Written scope and estimate" })).toBeVisible();
  await customerPage.getByRole("checkbox").check();
  await customerPage.getByRole("button", { name: "Accept version 1" }).click();
  await expect(customerPage.getByText(/Version 1 accepted/)).toBeVisible();
  await customerPage.close();

  staffMode = true;
  await page.reload();
  await page.getByLabel("Timezone (IANA)").fill("America/Los_Angeles");
  await page.getByLabel("Confirmed start in selected timezone").fill("2026-09-29T09:00");
  await page.getByLabel("Confirmed end in selected timezone").fill("2026-09-29T10:00");
  await page.getByRole("button", { name: "Confirm appointment" }).click();
  await expect(page.getByText(/Appointment confirmed at/)).toBeVisible();

  await page.getByLabel("Next status").selectOption("scheduled");
  await page.getByRole("button", { name: "Change status" }).click();
  await expect(page.getByText("Booking updated.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Next status")).not.toContainText("In progress");

  await page.getByLabel("Delivery owner reference").fill("delivery-owner:opaque-1");
  await page.getByLabel("Contact name").fill("Delivery test owner");
  await page.getByLabel("Contact detail").fill("delivery-owner@example.test");
  await page.getByRole("button", { name: "Save owner and contact" }).click();
  const deliverySection = page.getByRole("region", { name: "Delivery handoff" });
  await expect(deliverySection.getByRole("alert")).toContainText(/booking changed/i);
  await deliverySection.getByRole("button", { name: "Refresh booking" }).click();
  await page.getByRole("button", { name: "Review refreshed details" }).click();
  await page.getByLabel("Delivery owner reference").fill("delivery-owner:opaque-1");
  await page.getByLabel("Contact name").fill("Delivery test owner");
  await page.getByLabel("Contact detail").fill("delivery-owner@example.test");
  await page.getByRole("button", { name: "Save owner and contact" }).click();
  await expect(page.getByText(/Details saved as pending/)).toBeVisible();
  await expect(page.getByLabel("Next status")).not.toContainText("In progress");

  await page.getByRole("button", { name: "Confirm verified unchanged details" }).click();
  await expect(page.getByText("Delivery handoff confirmed.")).toBeVisible();
  await expect(page.getByLabel("Next status")).toContainText("In progress");
  expect(deliveryBodies.map((body) => body.contactVerified)).toEqual([false, false, true]);

  const ownerPage = await context.newPage();
  await loginAs(ownerPage, "customer");
  await ownerPage.route(`**/api/advisory-bookings/${id}`, (route) => route.fulfill({ json: booking }));
  await ownerPage.goto(`/advisory-bookings/${id}`);
  await expect(ownerPage.getByRole("region", { name: "Delivery handoff" })).toContainText("Delivery test owner");
  await expect(ownerPage.getByRole("region", { name: "Delivery handoff" })).toContainText("delivery-owner@example.test");
  await expect(ownerPage.getByRole("region", { name: "Delivery handoff" })).not.toContainText("delivery-owner:opaque-1");
  await ownerPage.close();

  await page.getByLabel("Contact detail").fill("new-delivery-owner@example.test");
  await expect(page.getByRole("button", { name: "Confirm verified unchanged details" })).toBeDisabled();
  await page.getByRole("button", { name: "Save owner and contact" }).click();
  await expect(page.getByText(/Details saved as pending/)).toBeVisible();
  await expect(page.getByLabel("Next status")).not.toContainText("In progress");
  await page.getByRole("button", { name: "Confirm verified unchanged details" }).click();
  await expect(page.getByText("Delivery handoff confirmed.")).toBeVisible();
  await page.getByLabel("Next status").selectOption("in_progress");
  await page.getByRole("button", { name: "Change status" }).click();
  await expect(page.getByText("Booking updated.", { exact: true })).toBeVisible();
  expect(deliveryBodies.map((body) => body.contactVerified)).toEqual([false, false, true, false, true]);
  await expect(page.getByRole("region", { name: "Delivery handoff" }).getByRole("status")).toContainText("cannot reopen or restart work");
  await expect(page.getByRole("region", { name: "Delivery handoff" }).getByLabel("Contact detail")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Offer agreement" }).getByRole("status")).toContainText("Agreement terms cannot be replaced now");
  await expect(page.getByRole("region", { name: "Offer agreement" }).getByRole("button", { name: "Offer new version" })).toHaveCount(0);

  const wrongOwner = await context.newPage();
  await wrongOwner.route("**/api/user", (route) => route.fulfill({ json: { ...customer, id: "other-customer" } }));
  await wrongOwner.route(`**/api/advisory-bookings/${id}`, (route) => route.fulfill({ status: 404, json: { error: "Not found" } }));
  await wrongOwner.goto(`/advisory-bookings/${id}`);
  await expect(wrongOwner.getByRole("heading", { name: "Request unavailable" })).toBeVisible();
  await expect(wrongOwner.getByRole("region", { name: "Delivery handoff" })).toHaveCount(0);
  await expect(wrongOwner.getByText("delivery-owner@example.test")).toHaveCount(0);
  await wrongOwner.close();
});

test("handoff controls remain hidden when the web delivery rollout flag is off", async ({ page }) => {
  test.skip(process.env.NEXT_PUBLIC_ADVISORY_DELIVERY_HANDOFFS_ENABLED === "true");
  await page.route("**/api/user", (route) => route.fulfill({ json: staff }));
  await page.route(`**/api/staff/advisory-bookings/${id}`, (route) => route.fulfill({ json: { ...initialBooking(), history: [] } }));
  await page.goto(`/staff/advisory-bookings/${id}`);
  await expect(page.getByRole("region", { name: "Delivery handoff" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Save owner and contact|Confirm verified unchanged details/ })).toHaveCount(0);
});
