import { expect, test, type Page } from "./fixtures";

async function selectTheme(page: Page, name: string) {
  await page.getByRole("button", { name: "Color theme" }).click();
  await page.getByRole("menuitemradio", { name, exact: true }).click();
  await expect(page.getByRole("menu", { name: "Color theme" })).toHaveCount(0);
}

async function expectTheme(page: Page, name: string) {
  await page.getByRole("button", { name: "Color theme" }).click();
  await expect(page.getByRole("menuitemradio", { name, exact: true })).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape");
}

async function expectFocusedAccountPage(page: Page) {
  await expect(page.getByRole("banner")).toHaveCount(0);
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(page.getByText("Connecting an MCP client?", { exact: true })).toHaveCount(0);
  const footer = page.getByRole("contentinfo", { name: "Account page links" });
  await expect(footer.getByRole("link", { name: "Back to public site" })).toHaveAttribute("href", "/");
  await expect(footer.getByRole("link", { name: "Browse the directory" })).toHaveAttribute("href", "/bot-directory");
  await expect(footer.getByLabel("Color theme")).toBeVisible();
}

test("login, email sign-in, confirmation, and reauthentication have no navigation header", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ status: 401, json: {} }));
  await page.goto("/login");
  await expect(page.getByRole("link", { name: "Continue with Google" })).toBeVisible();
  await expectFocusedAccountPage(page);
  await page.goto("/login/email");
  await expect(page.getByRole("button", { name: "Email me a sign-in link" })).toBeVisible();
  await expectFocusedAccountPage(page);
  for (const path of ["/auth/confirm", "/auth/reauth", "/auth/reauth/email"]) {
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
  await expectTheme(page, "System");
  const mark = page.getByRole("link", { name: "SkaleAgents home" }).locator("svg");
  for (const selected of ["light", "dark"]) {
    await selectTheme(page, selected === "light" ? "Light" : "Dark");
    await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${selected}\\b`));
    await expect(mark.locator("rect")).toHaveCSS("fill", "rgb(14, 21, 24)");
    await expect(mark.locator("path")).toHaveCSS("stroke", "rgb(0, 194, 168)");
  }
  const favicon = await page.request.get("/icon.svg");
  expect(await favicon.text()).toContain('fill="#0e1518"');
  expect(await favicon.text()).toContain('stroke="#00c2a8"');
  await page.goto("/login");
  await expectTheme(page, "Dark");
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await page.reload();
  await expectTheme(page, "Dark");
  await selectTheme(page, "System");
  await expect(page.locator("html")).toHaveClass(/\blight\b/);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await selectTheme(page, "Light");
  await expect(page.locator("html")).toHaveClass(/\blight\b/);
});

test("signed-in users can change theme from the dashboard toolbar", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: { id: "appearance-user", displayName: "Appearance User" } }));
  const personalId = "0198f0b0-0000-7000-8000-000000000001";
  const personal = { id: personalId, name: "Personal", kind: "personal", role: "owner" };
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: [personal] } }));
  await page.route(`**/api/workspaces/${personalId}`, route => route.fulfill({ json: { data: personal } }));
  for (const resource of ["jobs", "schedules", "bots"]) {
    await page.route(`**/api/${resource}`, route => route.fulfill({ json: { [resource]: [] } }));
  }
  await page.goto("/me");
  await expect(page.getByRole("button", { name: "Appearance User, account menu" })).toBeVisible();
  await selectTheme(page, "Dark");
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await selectTheme(page, "Light");
  await expect(page.locator("html")).toHaveClass(/\blight\b/);
  await page.setViewportSize({ width: 320, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("public navigation shows Sign in to guests and an account avatar to signed-in users", async ({ page }) => {
  let signedIn = false;
  await page.route("**/api/user", route => route.fulfill(signedIn
    ? { json: { id: "test-user", displayName: "Test User" } }
    : { status: 401, json: {} }));
  await page.goto("/");
  const header = page.getByRole("banner");
  const signIn = header.getByRole("link", { name: "Sign in", exact: true });
  await expect(signIn).toBeVisible();
  await expect(signIn).toHaveAttribute("href", "/login");
  await expect(header.getByRole("button", { name: "Account menu" })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Dashboard", exact: true })).toHaveCount(0);
  signedIn = true;
  await page.reload();
  await expect(header.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();
  const account = header.getByRole("button", { name: "Test User, account menu" });
  await expect(account).toBeVisible();
  await expect(account).toContainText("TU");
  await expect(signIn).toHaveCount(0);
});

test("invitation header shows Sign in without a guest avatar", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ status: 401, json: {} }));
  await page.goto("/workspace-invitations/accept");
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "Sign in", exact: true })).toHaveAttribute("href", "/login");
  await expect(header.getByRole("button", { name: "Account menu" })).toHaveCount(0);
});


test("theme menu is icon-only, keyboard accessible, and dismisses without changing the theme", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ status: 401, json: {} }));
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Color theme" });
  await expect(trigger).toHaveText("");
  await expect(trigger.locator("svg")).toBeVisible();
  expect((await trigger.boundingBox())!.width).toBeLessThanOrEqual(40);
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitemradio", { name: "System", exact: true })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitemradio", { name: "System", exact: true })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.getByRole("menuitemradio", { name: "Light", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await expect(trigger).toBeFocused();
  await trigger.click();
  for (const name of ["Light", "Dark", "System"]) {
    await expect(page.getByRole("menuitemradio", { name, exact: true }).locator("svg").first()).toBeVisible();
  }
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await page.getByRole("link", { name: "SkaleAgents home" }).click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expectTheme(page, "Dark");
  await page.setViewportSize({ width: 320, height: 900 });
  await trigger.click();
  const menu = await page.getByRole("menu", { name: "Color theme" }).boundingBox();
  expect(menu!.x).toBeGreaterThanOrEqual(0);
  expect(menu!.x + menu!.width).toBeLessThanOrEqual(320);
});
