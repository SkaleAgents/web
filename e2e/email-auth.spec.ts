import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
});

test("email sign-in sends a magic link, offers a resend, and reports failures", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/auth/email", route => {
    requests++;
    expect(route.request().postDataJSON()).toEqual({ email: "person@example.com", purpose: "signin" });
    return requests === 1
      ? route.fulfill({ status: 202, json: {} })
      : route.fulfill({ status: 429, json: { message: "Too many requests. Try again shortly." } });
  });
  await page.goto("/login/email");
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  await expect(page.getByText("New here? The link creates your account.")).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill("person@example.com");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("main").getByRole("heading", { name: "Check your email" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("status")).toContainText("person@example.com");
  await page.getByRole("button", { name: "Resend email" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Too many requests. Try again shortly.");
  expect(requests).toBe(2);
  await page.getByRole("button", { name: "Use a different email" }).click();
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("person@example.com");
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("email tokens are stripped before scripts and require explicit confirmation", async ({ page }) => {
  const token = "a".repeat(64);
  let confirmations = 0;
  const leaked: string[] = [];
  page.on("request", request => { if (request.url().includes(token)) leaked.push(request.url()); });
  await page.route("**/api/auth/email/inspect", route => route.fulfill({ json: { email: "person@example.com", purpose: "signin" } }));
  await page.route("**/api/auth/email/confirm", route => {
    confirmations++;
    expect(route.request().postDataJSON().token).toBe(token);
    return route.fulfill({ status: 422, json: { message: "This link is already used." } });
  });
  const response = await page.goto(`/auth/confirm#token=${token}&purpose=signin`);
  expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
  await expect(page).toHaveURL(/\/auth\/confirm$/);
  await expect(page.getByText("person@example.com", { exact: true })).toBeVisible();
  expect(confirmations).toBe(0);
  expect(await page.evaluate(() => JSON.stringify([localStorage, sessionStorage]))).not.toContain(token);
  await page.getByRole("button", { name: "Confirm and sign in" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("This link is already used.");
  expect(confirmations).toBe(1);
  expect(leaked).toEqual([]);
});

test("Google and GitHub come first, then email with passkeys inside it", async ({ page }) => {
  const authRequests: string[] = [];
  page.on("request", request => { if (request.url().includes("/api/auth/")) authRequests.push(request.url()); });
  await page.goto("/login");
  const main = page.getByRole("main");
  await expect(main.getByRole("link", { name: "Continue with Google" })).toBeVisible();
  await expect(main.getByRole("link", { name: "Continue with GitHub" })).toBeVisible();
  await expect(main.getByRole("button", { name: "Sign in with a passkey" })).toHaveCount(0);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await main.getByRole("link", { name: "Continue with email" }).click();
  await expect(page).toHaveURL(/\/login\/email$/);
  await expect(main.getByRole("button", { name: "Sign in with a passkey" })).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  expect(authRequests).toEqual([]);
});

for (const requiresPassword of [false, true]) {
  test(`signup confirmation uses the chosen password, other browser: ${requiresPassword}`, async ({ page }) => {
    const token = "b".repeat(64);
    await page.route("**/api/auth/email/inspect", route => route.fulfill({ json: { email: "person@example.com", purpose: "register", requiresPassword } }));
    await page.route("**/api/auth/email/confirm", route => {
      expect(route.request().postDataJSON()).toEqual({ token, purpose: "register", ...(requiresPassword ? { email: "person@example.com", password: "chosen-password123" } : {}) });
      return route.fulfill({ status: 422, json: { message: "This link is already used." } });
    });
    await page.goto(`/auth/confirm#token=${token}&purpose=register`);
    await expect(page.getByRole("heading", { name: "Confirm your email" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm email and sign in" })).toBeEnabled();
    await expect(page.getByLabel("New password")).toHaveCount(0);
    if (requiresPassword) await page.getByLabel("Password", { exact: true }).fill("chosen-password123");
    else await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Confirm email and sign in" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("This link is already used.");
  });
}
