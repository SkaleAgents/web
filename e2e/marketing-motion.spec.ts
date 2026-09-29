import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/user", (route) => route.fulfill({ status: 401, json: {} }));
  // Keep motion checks independent of third-party badge and publisher servers.
  await page.route("https://**/*", (route) => route.abort());
});

test("badges move automatically, pause on hover, and allow touch scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const slider = page.getByRole("region", { name: "Directory badges", exact: true });
  const track = slider.locator(".footer-badge-track");
  const position = () => track.evaluate((element) => element.getBoundingClientRect().x);
  await slider.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const initial = await position();
  await expect.poll(position).toBeLessThan(initial - 2);
  await slider.hover();
  await expect.poll(() => track.evaluate((element) => getComputedStyle(element).animationPlayState)).toBe("paused");
  const hovered = await position();
  await page.waitForTimeout(200);
  expect(await position()).toBeCloseTo(hovered, 1);

  await page.mouse.move(0, 0);
  await expect.poll(position).toBeLessThan(hovered - 2);
  await expect(page.getByRole("button", { name: "Pause badges" })).toHaveCount(0);

  await slider.dispatchEvent("touchstart");
  await slider.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
  await expect(slider.getByRole("link").last()).toBeInViewport();
});

test("examples cycle through all four topics and pause during interaction", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const explorer = page.locator(".example-explorer");
  await explorer.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(explorer).toHaveAttribute("data-playing", "true");

  // Speed up the real CSS timer without synthesizing the animation-end event.
  for (const topic of ["Reliability", "AI workloads", "Scaling & cost", "Security"]) {
    await explorer.locator(".example-countdown").evaluate((element) => element.getAnimations()[0].updatePlaybackRate(30));
    await expect(page.getByRole("radio", { name: topic, exact: true })).toBeChecked();
    await expect(page.getByRole("region", { name: `${topic} example`, exact: true })).toBeVisible();
  }

  await explorer.hover();
  await explorer.locator(".example-countdown").evaluate((element) => element.getAnimations()[0].updatePlaybackRate(100));
  await page.waitForTimeout(250);
  await expect(page.getByRole("radio", { name: "Security", exact: true })).toBeChecked();
  await page.getByRole("radio", { name: "Security", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await page.mouse.move(0, 0);
  await expect(page.getByRole("radio", { name: "Reliability", exact: true })).toBeChecked();
  await expect(explorer).toHaveAttribute("data-playing", "false");
});

test("sample preview stays in the page while its editor loads on approach", async ({ page }) => {
  await page.goto("/");
  const demo = page.locator("#sample-demo");
  await expect(demo.getByRole("heading", { name: "Change a setting. See why it matters." })).toBeVisible();
  const editor = demo.getByRole("textbox", { name: "Sample deployment settings (JSON)" });
  await expect(editor).toBeDisabled();

  await demo.scrollIntoViewIfNeeded();
  await expect(editor).toBeEnabled();
  await demo.getByRole("button", { name: "Apply example improvements" }).click();
  await expect(demo.getByRole("heading", { name: "3 of 3 sample checks configured" })).toBeVisible();
});

test("starting point choices activate when the section approaches", async ({ page }) => {
  await page.goto("/");
  const picker = page.locator("#next-step-heading").locator("xpath=..");
  const goal = picker.getByRole("radio", { name: "Try a specialist", exact: true });
  await expect(goal).toBeDisabled();

  await picker.scrollIntoViewIfNeeded();
  await expect(goal).toBeEnabled();
  await picker.getByText("Try a specialist", { exact: true }).click();
  await expect(goal).toBeChecked();
  await expect(picker.getByRole("radio", { name: "Find a specialist bot", exact: true })).toBeVisible();
});

test("all directory badges remain reachable by keyboard on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  const slider = page.getByRole("region", { name: "Directory badges", exact: true });
  await slider.focus();
  const links = slider.getByRole("link");
  await expect(links).toHaveCount(54);
  await page.keyboard.press("Tab");
  await expect(links.first()).toBeFocused();
  for (let index = 1; index < 54; index++) await page.keyboard.press("Tab");
  await expect(links.last()).toBeFocused();
  await expect(links.last()).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test("reduced motion leaves a static, manually scrollable badge strip", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const explorer = page.locator(".example-explorer");
  await explorer.scrollIntoViewIfNeeded();
  await expect(explorer.locator(".example-countdown")).toBeAttached();
  const slider = page.getByRole("region", { name: "Directory badges", exact: true });
  await slider.scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Pause badges" })).toBeHidden();
  expect(await slider.locator(".footer-badge-track").evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
  expect(await page.locator(".hero-signal-flow").evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
  expect(await page.locator(".example-countdown").evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
  await slider.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
  await expect(slider.getByRole("link").last()).toBeInViewport();
});
