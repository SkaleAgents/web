import { expect, test } from "@playwright/test";

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

test("magic links and password setup work without entering a current password", async ({ page }) => {
  const purposes: string[] = [];
  await page.route("**/api/auth/email", route => {
    purposes.push(route.request().postDataJSON().purpose);
    return route.fulfill({ status: 202, json: { message: "Check your email for a link valid for 15 minutes." } });
  });
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("person@example.com");
  await page.getByRole("button", { name: "Email me a magic link" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Check your email" })).toBeVisible();
  await page.getByRole("button", { name: "Create an account", exact: true }).click();
  await page.getByRole("button", { name: "Verify email to set a password" }).click();
  await expect.poll(() => purposes).toEqual(["signin", "password"]);
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

test("passkey cancellation offers email fallback", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.credentials, "get", { value: async () => { throw new DOMException("cancelled", "NotAllowedError"); } });
  });
  await page.route("**/api/auth/passkeys/options", route => route.fulfill({ json: { challengeId: "test", publicKey: { challenge: "YQ", rpId: "localhost", userVerification: "required" } } }));
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("person@example.com");
  await page.getByRole("button", { name: "Use Touch ID / Face ID" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Passkey request cancelled or unavailable");
  await expect(page.getByRole("button", { name: "Email me a magic link" })).toBeEnabled();
});
