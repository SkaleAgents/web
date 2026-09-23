import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/user", (route) => route.fulfill({ status: 401, json: {} }));
  // Keep motion checks independent of third-party badge and publisher servers.
  await page.route("https://**/*", (route) => route.abort());
});

test("badges move automatically, pause on hover, and can be paused manually", async ({ page }) => {
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
  await page.getByRole("button", { name: "Pause badges" }).click();
  await page.mouse.move(0, 0);
  const paused = await position();
  await page.waitForTimeout(200);
  expect(await position()).toBeCloseTo(paused, 1);
  await page.getByRole("button", { name: "Resume badges" }).click();
  await page.mouse.move(0, 0);
  await expect.poll(position).toBeLessThan(paused - 2);

  await slider.dispatchEvent("touchstart");
  await expect(page.getByRole("button", { name: "Resume badges" })).toBeVisible();
  await slider.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
  await expect(slider.getByRole("link").last()).toBeInViewport();
});

test("all original badges remain reachable by keyboard on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  const slider = page.getByRole("region", { name: "Directory badges", exact: true });
  await slider.focus();
  const links = slider.getByRole("link");
  await expect(links).toHaveCount(35);
  await page.keyboard.press("Tab");
  await expect(links.first()).toBeFocused();
  for (let index = 1; index < 35; index++) await page.keyboard.press("Tab");
  await expect(links.last()).toBeFocused();
  await expect(links.last()).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test("reduced motion leaves a static, manually scrollable badge strip", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const slider = page.getByRole("region", { name: "Directory badges", exact: true });
  await slider.scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Pause badges" })).toBeHidden();
  expect(await slider.locator(".footer-badge-track").evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
  expect(await page.locator(".hero-signal-flow").evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
  await slider.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
  await expect(slider.getByRole("link").last()).toBeInViewport();
});
