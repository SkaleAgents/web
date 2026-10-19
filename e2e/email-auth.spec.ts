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
  await expect(page.getByText(/By signing up/)).toHaveCount(0);
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
  await page.route("**/api/auth/email/inspect", route => route.fulfill({ json: { email: "person@example.com", purpose: "signin", newAccount: false } }));
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
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByLabel("Your name")).toHaveCount(0);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("This link is already used.");
  expect(confirmations).toBe(1);
  expect(leaked).toEqual([]);
});

test("sign-in leads with a passkey, then Google, GitHub, and email", async ({ page }) => {
  const authRequests: string[] = [];
  page.on("request", request => { if (request.url().includes("/api/auth/")) authRequests.push(request.url()); });
  await page.goto("/login");
  const main = page.getByRole("main");
  await expect(main.getByRole("link", { name: "Continue with Google" })).toBeVisible();
  await expect(main.getByRole("link", { name: "Continue with GitHub" })).toBeVisible();
  await expect(main.getByRole("link", { name: "Continue with email" })).toBeVisible();
  await expect(main.getByRole("button", { name: "Sign in with a passkey" })).toBeVisible();
  expect(await main.locator("a, button").evaluateAll(nodes => nodes.slice(0, 4).map(node => node.textContent?.trim()))).toEqual(["Sign in with a passkey", "Continue with Google", "Continue with GitHub", "Continue with email"]);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await main.getByRole("link", { name: "Continue with email" }).click();
  await expect(page).toHaveURL(/\/login\/email$/);
  await expect(main.getByRole("button", { name: "Sign in with a passkey" })).toHaveCount(0);
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  expect(authRequests).toEqual([]);
});

test("sign-up has its own page, states the terms, and a new account's link says so", async ({ page }) => {
  await page.route("**/api/auth/email", route => route.fulfill({ status: 202, json: {} }));
  await page.goto("/login");
  await expect(page.getByText(/By signing up/)).toHaveCount(0);
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByRole("heading", { name: "Create your SkaleAgents account" })).toBeVisible();
  await expect(page.getByText(/By signing up, you agree to the/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in with a passkey" })).toHaveCount(0);
  await page.getByRole("link", { name: "Continue with email" }).click();
  await expect(page).toHaveURL(/\/signup\/email$/);
  await expect(page.getByRole("button", { name: "Sign in with a passkey" })).toHaveCount(0);
  await page.getByLabel("Email", { exact: true }).fill("new@example.com");
  await page.getByRole("button", { name: "Email me a sign-up link" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("sign-up link");

  const token = "c".repeat(64);
  await page.route("**/api/auth/email/inspect", route => route.fulfill({ json: { email: "new@example.com", purpose: "signin", newAccount: true } }));
  await page.goto(`/auth/confirm#token=${token}&purpose=signin`);
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await expect(page.getByLabel("Your name")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /Set up a passkey/ })).toBeChecked();
  await expect(page.getByRole("button", { name: "Create account" })).toBeDisabled();
  await page.getByRole("checkbox", { name: /Terms of Service/ }).check();
  await expect(page.getByRole("button", { name: "Create account" })).toBeEnabled();
});
