import { expect, test } from "./fixtures";

const bookingId = "00000000-0000-4000-8000-000000000101";
const customer = { id: "customer-a", displayName: "Customer A", email: "a@example.test", grokSubject: null };
const baseBooking = {
  id: bookingId,
  version: 3,
  assigneeRef: "expert:opaque-1",
  source: { type: "audit_job", id: "00000000-0000-4000-8000-000000000102" },
  status: "accepted",
  scope: "Original request scope",
  urgency: "soon",
  preferredWindow: { startAt: "2026-09-28T16:00:00Z", endAt: "2026-09-28T17:00:00Z" },
  notes: null,
  billing: { billableMinutes: null, feeCents: null, currency: "USD" },
  agreement: {
    id: "00000000-0000-4000-8000-000000000103",
    version: 2,
    scope: "Review the rollback procedure",
    currency: "USD",
    quotedFeeCents: 31250,
    minimumBillableMinutes: 60,
    incrementMinutes: 15,
    rateCentsPerHour: 25000,
    cancellationTermsVersion: "paid-pilot-v1",
    offeredAt: "2026-09-25T16:00:00Z",
    acceptedAt: null as string | null,
  },
  appointment: null,
  delivery: null,
  createdAt: "2026-09-25T15:00:00Z",
  updatedAt: "2026-09-25T16:00:00Z",
};

test("customer reviews refreshed terms after a stale response before accepting", async ({ page }) => {
  let current = baseBooking;
  let staleResponse = true;
  let acceptedRequest: { ifMatch: string | undefined; agreementVersion: number } | null = null;
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/user", (route) => route.fulfill({ json: customer }));
  await page.route(`**/api/advisory-bookings/${bookingId}`, (route) => route.fulfill({ json: current }));
  await page.route(`**/api/advisory-bookings/${bookingId}/agreement/accept`, async (route) => {
    const body = route.request().postDataJSON() as { agreementVersion: number };
    if (staleResponse) {
      staleResponse = false;
      current = { ...baseBooking, version: 4, agreement: { ...baseBooking.agreement, version: 3, scope: "Review the revised rollback procedure" } };
      await route.fulfill({ status: 409, json: { error: "Advisory agreement version is no longer current", booking: current } });
      return;
    }
    acceptedRequest = { ifMatch: route.request().headers()["if-match"], agreementVersion: body.agreementVersion };
    current = { ...current, version: 5, agreement: { ...current.agreement, acceptedAt: "2026-09-25T16:30:00Z" } };
    await route.fulfill({ json: current });
  });
  await page.goto(`/advisory-bookings/${bookingId}`, { waitUntil: "domcontentloaded" });

  await expect(page.getByText("$312.50 USD")).toBeVisible();
  await expect(page.getByText("$250.00 per hour")).toBeVisible();
  await expect(page.getByText(/15-minute increments/)).toBeVisible();
  await expect(page.getByText(/Cancel at least 24 hours/)).toBeVisible();
  await expect(page.getByText(/payment successful|payment received/i)).toHaveCount(0);

  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Accept version 2" }).click();
  await expect(page.getByText(/This offer changed before your acceptance was saved/)).toBeVisible();
  await expect(page.getByText("Review the revised rollback procedure")).toBeVisible();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Accept version 3" })).toBeDisabled();

  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Accept version 3" }).click();
  await expect(page.getByRole("status")).toContainText("Version 3 accepted");
  expect(acceptedRequest).toEqual({ ifMatch: "4", agreementVersion: 3 });
});

test("guessed booking ID and customer account cannot expose another customer's agreement", async ({ page }) => {
  await page.route("**/api/user", (route) => route.fulfill({ json: customer }));
  await page.route(`**/api/advisory-bookings/${bookingId}`, (route) => route.fulfill({ status: 404, json: { error: "Not found" } }));
  await page.goto(`/advisory-bookings/${bookingId}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Request unavailable" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Advisory agreement" })).toHaveCount(0);
  await expect(page.getByText("Review the rollback procedure")).toHaveCount(0);
});

test("customer sees the confirmed appointment with its timezone, separate from the requested window", async ({ page }) => {
  const appointment = {
    confirmedWindow: { startAt: "2026-09-29T16:00:00Z", endAt: "2026-09-29T17:00:00Z", timezone: "America/Los_Angeles" },
    confirmedAt: "2026-09-25T18:00:00Z",
  };
  await page.route("**/api/user", (route) => route.fulfill({ json: customer }));
  await page.route(`**/api/advisory-bookings/${bookingId}`, (route) => route.fulfill({ json: { ...baseBooking, appointment } }));
  await page.goto(`/advisory-bookings/${bookingId}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/Preferred window \(requested, not confirmed\)/)).toBeVisible();
  await expect(page.getByRole("region", { name: "Confirmed appointment" })).toContainText("America/Los_Angeles");
  await expect(page.getByRole("region", { name: "Confirmed appointment" })).toContainText("separate from your requested preferred window");
});

test("staff offer screen sends the reserved shape, duplicate clicks do not repeat it", async ({ page }) => {
  let updateCount = 0;
  let currentStaffBooking = { ...baseBooking, history: [] };
  let releaseOffer!: () => void;
  const offerBarrier = new Promise<void>((resolve) => { releaseOffer = resolve; });
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/user", (route) => route.fulfill({ json: { ...customer, id: "staff-a", staffRole: "operator" } }));
  await page.route(`**/api/staff/advisory-bookings/${bookingId}`, (route) => route.fulfill({ json: currentStaffBooking }));
  await page.route(`**/api/staff/advisory-bookings/${bookingId}/agreement`, async (route) => {
    updateCount += 1;
    const body = route.request().postDataJSON();
    expect(route.request().headers()["if-match"]).toBe("3");
    expect(body).toEqual({
      scope: "Review the rollback procedure",
      quotedFeeCents: 31250,
      currency: "USD",
      minimumBillableMinutes: 60,
      incrementMinutes: 15,
      rateCentsPerHour: 25000,
      cancellationTermsVersion: "paid-pilot-v1",
    });
    await offerBarrier;
    currentStaffBooking = { ...baseBooking, version: 4, history: [], agreement: { ...baseBooking.agreement, version: 3 } };
    await route.fulfill({ json: currentStaffBooking });
  });
  await page.goto(`/staff/advisory-bookings/${bookingId}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: `Booking #${bookingId.slice(0, 8)}` })).toBeVisible();
  await page.getByLabel("Exact scope").fill("Review the rollback procedure");
  await page.getByLabel("Written estimate (USD)").fill("312.50");
  const submit = page.getByRole("button", { name: "Offer new version" });
  await submit.click();
  await expect(page.getByRole("button", { name: "Saving offer…" })).toBeVisible();
  await page.getByRole("region", { name: "Offer agreement" }).locator("form").evaluate((form) => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  expect(updateCount).toBe(1);
  releaseOffer();
  await expect(page.getByText(/Customer acceptance is still required/)).toBeVisible();
  await expect(page.getByText(/No payment is collected or confirmed here/)).toBeVisible();
});

test("staff controls are unavailable to a customer account", async ({ page }) => {
  let staffListRequests = 0;
  await page.route("**/api/user", (route) => route.fulfill({ json: customer }));
  await page.route("**/api/staff/advisory-bookings**", (route) => { staffListRequests += 1; return route.fulfill({ status: 403, json: { error: "Staff access required" } }); });
  await page.goto("/staff/advisory-bookings", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Staff access required" })).toBeVisible();
  expect(staffListRequests).toBe(0);
  await expect(page.getByText("Customer agreement offer")).toHaveCount(0);
});

test("agreement navigation stays hidden while the web rollout flag is off", async ({ page }) => {
  test.skip(process.env.NEXT_PUBLIC_ADVISORY_AGREEMENTS_ENABLED === "true");
  await page.route("**/api/user", (route) => route.fulfill({ json: customer }));
  await page.goto("/me/jobs", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "Advisory requests" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Staff bookings" })).toHaveCount(0);
});
