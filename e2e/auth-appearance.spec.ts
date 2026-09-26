import { expect, test, type Page } from "@playwright/test";

async function expectFocusedAccountPage(page: Page) {
  await expect(page.getByRole("banner")).toHaveCount(0);
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(page.getByText("Connecting an MCP client?", { exact: true })).toHaveCount(0);
  const footer = page.getByRole("contentinfo", { name: "Account page links" });
  await expect(footer.getByRole("link", { name: "Back to public site" })).toHaveAttribute("href", "/");
  await expect(footer.getByRole("link", { name: "Browse the directory" })).toHaveAttribute("href", "/bots");
  await expect(footer.getByLabel("Color theme")).toBeVisible();
}

test("login, signup, recovery, confirmation, and reauthentication have no navigation header", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ status: 401, json: {} }));
  await page.goto("/login");
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expectFocusedAccountPage(page);
  await page.getByRole("button", { name: "Create an account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await expectFocusedAccountPage(page);
  await page.getByRole("button", { name: "Back to sign in" }).click();
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await expectFocusedAccountPage(page);
  for (const path of ["/auth/confirm", "/auth/reauth"]) {
    await page.goto(path);
    await expectFocusedAccountPage(page);
  }
});

test("theme selection persists and System follows the device while the logo matches the favicon", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ status: 401, json: {} }));
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const theme = page.getByLabel("Color theme");
  await expect(theme).toBeEnabled();
  await expect(theme).toHaveValue("system");
  const mark = page.getByRole("link", { name: "SkaleAgents home" }).locator("svg");
  for (const selected of ["light", "dark"]) {
    await theme.selectOption(selected);
    await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${selected}\\b`));
    await expect(mark.locator("rect")).toHaveCSS("fill", "rgb(14, 21, 24)");
    await expect(mark.locator("path")).toHaveCSS("stroke", "rgb(0, 194, 168)");
  }
  const favicon = await page.request.get("/icon.svg");
  expect(await favicon.text()).toContain('fill="#0e1518"');
  expect(await favicon.text()).toContain('stroke="#00c2a8"');
  await page.goto("/login");
  await expect(theme).toHaveValue("dark");
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await page.reload();
  await expect(theme).toHaveValue("dark");
  await theme.selectOption("system");
  await expect(page.locator("html")).toHaveClass(/\blight\b/);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await theme.selectOption("light");
  await expect(page.locator("html")).toHaveClass(/\blight\b/);
});

test("signed-in users can change theme from their dashboard account menu", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: { id: "appearance-user", displayName: "Appearance User" } }));
  for (const resource of ["jobs", "schedules", "bots"]) {
    await page.route(`**/api/${resource}`, route => route.fulfill({ json: { [resource]: [] } }));
  }
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Appearance, account menu" }).click();
  await page.getByLabel("Color theme").selectOption("dark");
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await page.getByLabel("Color theme").selectOption("light");
  await expect(page.locator("html")).toHaveClass(/\blight\b/);
  await page.setViewportSize({ width: 320, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("public navigation only offers Dashboard and the account avatar to signed-in users", async ({ page }) => {
  let signedIn = false;
  await page.route("**/api/user", route => route.fulfill(signedIn
    ? { json: { id: "test-user", displayName: "Test User" } }
    : { status: 401, json: {} }));
  await page.goto("/");
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
  await expect(header.getByRole("link", { name: "Dashboard", exact: true })).toHaveCount(0);
  await expect(header.getByRole("button", { name: /account menu/ })).toHaveCount(0);
  signedIn = true;
  await page.reload();
  await expect(header.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();
  const account = header.getByRole("button", { name: "Test, account menu" });
  await expect(account).toBeVisible();
  await expect(account).toContainText("TU");
  await expect(header.getByRole("link", { name: "Sign in", exact: true })).toHaveCount(0);
});
