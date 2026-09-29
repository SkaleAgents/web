import { expect, test } from "./fixtures";

const bookUrl = "https://harun.dev/book?sa_ref=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

test("a signed-in customer opens a prepared portfolio link without leaking the dashboard URL", async ({ page, context }) => {
  test.skip(process.env.NEXT_PUBLIC_PORTFOLIO_BOOKING_HANDOFF_ENABLED !== "true");

  let referralRequests = 0;
  await page.route("**/api/user", (route) => route.fulfill({ json: {
    id: "customer-a", displayName: "Customer A", email: "customer@example.test", grokSubject: null,
  } }));
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/advisory-bookings", (route) => route.fulfill({ json: { bookings: [] } }));
  await page.route("**/api/portfolio-booking-referrals", (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { referrals: [] } });
    referralRequests += 1;
    expect(route.request().postDataJSON()).toEqual({});
    return route.fulfill({ status: 201, json: { bookUrl } });
  });
  await context.route("https://harun.dev/book**", (route) => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<h1>Portfolio booking fixture</h1>",
  }));

  await page.goto("/me/advisory-bookings");
  await expect(page.getByRole("heading", { name: "Advisory requests" })).toBeVisible();
  await expect(page.getByText("No linked consultations yet.")).toBeVisible();
  const popupPromise = context.waitForEvent("page");
  await page.getByRole("button", { name: "Book a consultancy session" }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(bookUrl);
  await expect(popup.getByRole("heading", { name: "Portfolio booking fixture" })).toBeVisible();
  expect(referralRequests).toBe(1);
  expect(await popup.evaluate(() => document.referrer)).toBe("");
  await popup.close();
});
