import { expect, test } from "@playwright/test";

test("public pages in Europe ask for cookie consent until the visitor accepts", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "cf-ipcountry": "DE" });
  await page.goto("/");
  const notice = page.getByRole("region", { name: "Cookie consent" });
  await expect(notice).toBeVisible();
  await expect(notice.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy#cookies");
  await expect(notice.getByRole("button", { name: "Deny" })).toBeVisible();

  await notice.getByRole("button", { name: "Accept" }).click();
  await expect(notice).toHaveCount(0);

  await page.goto("/privacy#cookies");
  await expect(page.getByRole("heading", { name: "Cookies" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Cookie consent" })).toHaveCount(0);
  await expect(page.getByText("Deny sends you to Google")).toBeVisible();
});

test("visitors outside Europe do not see cookie consent", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "cf-ipcountry": "US" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await expect(page.getByRole("region", { name: "Cookie consent" })).toHaveCount(0);
});

test("deny leaves for Google and does not store acceptance", async ({ page, context }) => {
  await page.setExtraHTTPHeaders({ "cf-ipcountry": "GB" });
  await page.route("https://www.google.com/**", route => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><title>Google</title><p>Left SkaleAgents</p>",
  }));
  await page.goto("/");
  await page.getByRole("button", { name: "Deny" }).click();
  await expect(page).toHaveURL(/https:\/\/www\.google\.com\/?/);
  const cookies = await context.cookies();
  expect(cookies.some(cookie => cookie.name === "skale_cookie_consent" && cookie.value === "accepted")).toBe(false);
});

test("an older denial still asks for acceptance in Europe", async ({ page, context, baseURL }) => {
  await page.setExtraHTTPHeaders({ "cf-ipcountry": "FR" });
  await context.addCookies([{ name: "skale_cookie_consent", value: "declined", url: baseURL }]);
  await page.goto("/");
  const notice = page.getByRole("region", { name: "Cookie consent" });
  await expect(notice).toBeVisible();
  await notice.getByRole("button", { name: "Accept" }).click();
  await expect(notice).toHaveCount(0);
  const cookies = await context.cookies();
  expect(cookies.some(cookie => cookie.name === "skale_cookie_consent" && cookie.value === "accepted")).toBe(true);
  expect(cookies.some(cookie => cookie.name === "skale_cookie_consent" && cookie.value === "declined")).toBe(false);
});

test("the dashboard uses the same cookie consent notice in Europe", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "cf-ipcountry": "DE" });
  await page.goto("/login");
  await expect(page.getByRole("region", { name: "Cookie consent" })).toBeVisible();
  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByRole("region", { name: "Cookie consent" })).toHaveCount(0);
  const cookies = await page.context().cookies();
  expect(cookies.some(cookie => cookie.name === "skale_cookie_consent" && cookie.value === "accepted")).toBe(true);
});
