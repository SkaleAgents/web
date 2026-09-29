import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
});

test("password sign-in reports failures and allows a retry", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/auth/password", route => {
    requests++;
    expect(route.request().postDataJSON()).toEqual({ email: "person@example.com", password: "test-password123" });
    return route.fulfill({ status: 422, json: { message: "Email or password is incorrect." } });
  });
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("person@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-password123");
  await page.getByRole("button", { name: "Sign in with password" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Email or password is incorrect.");
  await expect(page.getByRole("button", { name: "Sign in with password" })).toBeEnabled();
  expect(requests).toBe(1);
});

test("signup asks for email and password before verification and recovery stays separate", async ({ page }) => {
  let registrations = 0;
  await page.route("**/api/auth/register", route => {
    registrations++;
    expect(route.request().postDataJSON()).toEqual({ email: "person@example.com", password: "chosen-password123", password_confirmation: "chosen-password123" });
    return route.fulfill({ status: 202, json: { message: "Check your email to finish signing up." } });
  });
  await page.route("**/api/auth/email", route => {
    expect(route.request().postDataJSON()).toEqual({ email: "person@example.com", purpose: "password" });
    return route.fulfill({ status: 202, json: {} });
  });
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("person@example.com");
  await page.getByRole("button", { name: "Create an account", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill("chosen-password123");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("main").getByRole("heading", { name: "Check your email" })).toBeVisible();
  expect(registrations).toBe(1);
  await page.getByRole("button", { name: "Resend email" }).click();
  await expect.poll(() => registrations).toBe(2);
  await page.getByRole("button", { name: "Back to sign in" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("password-reset link");
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

test("Google comes first with a direct email and password form", async ({ page }) => {
  const authRequests: string[] = [];
  page.on("request", request => { if (request.url().includes("/api/auth/")) authRequests.push(request.url()); });
  await page.goto("/login");
  const main = page.getByRole("main");
  await expect(main.getByRole("link", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(main.getByRole("button", { name: "Next", exact: true })).toHaveCount(0);
  await expect(main.getByRole("button", { name: /Touch ID|magic link/ })).toHaveCount(0);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByLabel("Password", { exact: true }).fill("unsubmitted-password");
  await page.getByRole("button", { name: "Create an account", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
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
