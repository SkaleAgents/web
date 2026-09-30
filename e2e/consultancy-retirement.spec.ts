import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const bookingUrl = "https://harun.dev/book";
const retiredCustomerPaths = [
  "/consultancy", "/advisory-bookings/private-booking",
  "/dashboard/consultancy", "/dashboard/consultancy/private-booking",
  "/dashboard/advisory-bookings/private-booking", "/me/consultancy/private-booking",
  "/me/advisory-bookings", "/org/private-organization/consultancy/private-booking",
  "/org/private-organization/advisory-bookings/private-booking",
];

for (const path of retiredCustomerPaths) {
  test(`retired ${path} redirects without private information`, async ({ request }) => {
    const response = await request.get(`${path}?sourceId=private-audit&token=private-token&next=https://untrusted.example`, { maxRedirects: 0 });
    expect(response.status()).toBe(303);
    expect(response.headers().location).toBe(bookingUrl);
    expect(response.headers()["referrer-policy"]).toBe("no-referrer");
    expect(response.headers()["cache-control"]).toBe("no-store");
  });
}

test("obsolete form submissions switch to GET before leaving SkaleAgents", async ({ request }) => {
  const response = await request.post("/dashboard/consultancy", {
    data: { notes: "private notes", sourceId: "private-audit" }, maxRedirects: 0,
  });
  expect(response.status()).toBe(303);
  expect(response.headers().location).toBe(bookingUrl);
});

test("public booking link works signed out without contacting a booking API", async ({ page }) => {
  const privateRequests: string[] = [];
  await page.route("**/api/user", route => route.fulfill({ status: 401, json: {} }));
  page.on("request", request => {
    if (/\/api\/(?:consultancy|advisory-bookings|portfolio-booking)/.test(request.url())) privateRequests.push(request.url());
  });
  await page.route(bookingUrl, route => {
    expect(route.request().headers().referer).toBeUndefined();
    return route.fulfill({ body: "<h1>External booking</h1>", contentType: "text/html" });
  });
  await page.goto("/contact");
  const link = page.getByRole("link", { name: "Book consultancy on harun.dev" });
  await expect(link).toHaveAttribute("href", bookingUrl);
  await link.click();
  await expect(page.getByRole("heading", { name: "External booking" })).toBeVisible();
  expect(privateRequests).toEqual([]);
});

for (const path of ["/staff/consultancy", "/staff/advisory-bookings", "/staff/advisory-bookings/private-booking"]) {
  test(`retired staff page ${path} is gone`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
  });
}

for (const prefix of ["/workspaces/private-organization", "/dashboard/workspaces/private-organization"]) {
  for (const feature of ["consultancy", "advisory-bookings"]) {
    test(`legacy alias ${prefix}/${feature} strips context before external navigation`, async ({ page, request }) => {
      const externalRequests = await captureRedirectedBooking(page);
      await page.goto(`${prefix}/${feature}/private-booking?token=private-token`);
      await expect(page.getByRole("heading", { name: "External booking" })).toBeVisible();
      expect(externalRequests).toEqual([{ method: "GET", body: null, referrer: null }]);

      const first = await request.post(`${prefix}/${feature}`, { data: { notes: "private" }, maxRedirects: 0 });
      expect(first.status()).toBe(307);
      const target = new URL(first.headers().location, first.url());
      expect(target.origin).toBe(new URL(first.url()).origin);
      const final = await request.post(target.toString(), { data: { notes: "private" }, maxRedirects: 0 });
      expect(final.status()).toBe(303);
      expect(final.headers().location).toBe(bookingUrl);
      expect(final.headers()["referrer-policy"]).toBe("no-referrer");
    });
  }
}

test("a browser form POST becomes an empty GET without a referrer at the external site", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ status: 401, json: {} }));
  const externalRequests = await captureRedirectedBooking(page);
  await page.goto("/contact");
  await page.evaluate(() => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/dashboard/consultancy?sourceId=private-audit";
    const notes = document.createElement("input");
    notes.name = "notes";
    notes.value = "Private booking notes";
    form.append(notes);
    document.body.append(form);
    form.submit();
  });
  await expect(page.getByRole("heading", { name: "External booking" })).toBeVisible();
  expect(externalRequests).toEqual([{ method: "GET", body: null, referrer: null }]);
});

async function captureRedirectedBooking(page: Page) {
  const requests: { method: string; body: string | null; referrer: string | null }[] = [];
  // Playwright route handlers only intercept the first URL in a redirect chain.
  // CDP captures the external hop without sending traffic to the real site.
  const session = await page.context().newCDPSession(page);
  await session.send("Fetch.enable", { patterns: [{ urlPattern: "https://harun.dev/*", requestStage: "Request" }] });
  session.on("Fetch.requestPaused", async ({ requestId, request }) => {
    requests.push({ method: request.method, body: request.postData ?? null, referrer: request.headers.Referer ?? null });
    await session.send("Fetch.fulfillRequest", {
      requestId, responseCode: 200,
      responseHeaders: [{ name: "Content-Type", value: "text/html" }],
      body: Buffer.from("<h1>External booking</h1>").toString("base64"),
    });
  });
  return requests;
}
