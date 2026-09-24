import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/user", (route) => route.fulfill({ status: 401, json: {} }));
});

test("desktop menus open on hover, bridge the panel gap, and dismiss on exit", async ({ page }) => {
  await page.goto("/studio");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  const explore = nav.getByRole("button", { name: "Explore", exact: true });
  await explore.hover();
  await expect(explore).toHaveAttribute("aria-expanded", "true");
  // A click following pointer entry must not immediately collapse the hovered menu.
  await explore.click();
  await expect(explore).toHaveAttribute("aria-expanded", "true");
  const trigger = await explore.boundingBox();
  await page.mouse.move(trigger!.x + trigger!.width / 2, trigger!.y + trigger!.height + 6);
  await page.waitForTimeout(250);
  await expect(nav.getByRole("link", { name: /Bot directory/ })).toBeVisible();
  await nav.getByRole("link", { name: /Bot directory/ }).hover();
  await expect(explore).toHaveAttribute("aria-expanded", "true");
  const review = nav.getByRole("button", { name: "Review", exact: true });
  await review.hover();
  await expect(explore).toHaveAttribute("aria-expanded", "false");
  await expect(review).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("link", { name: "SkaleAgents home" }).hover();
  await expect(review).toHaveAttribute("aria-expanded", "false");
  const chevron = await explore.locator("svg").boundingBox();
  const label = await explore.locator("span").boundingBox();
  expect(Math.abs(chevron!.y + chevron!.height / 2 - label!.y - label!.height / 2)).toBeLessThan(1);
});

test("touch menus toggle without hover and destination taps navigate", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.route("**/api/user", (route) => route.fulfill({ status: 401, json: {} }));
  try {
    await page.goto("/studio");
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    const explore = nav.getByRole("button", { name: "Explore", exact: true });
    await explore.tap();
    await expect(explore).toHaveAttribute("aria-expanded", "true");
    await explore.tap();
    await expect(explore).toHaveAttribute("aria-expanded", "false");
    await explore.tap();
    await nav.getByRole("link", { name: /Prompt library/ }).tap();
    await expect(page).toHaveURL(/\/prompts$/);
  } finally {
    await context.close();
  }
});

test("grouped navigation supports keyboard dismissal, active routes, and mobile", async ({ page }) => {
  await page.goto("/studio");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  const build = nav.getByRole("button", { name: "Build & connect" });
  await build.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(nav.getByRole("link", { name: /Creator Studio/ })).toBeFocused();
  await expect(nav.getByRole("link", { name: /Creator Studio/ })).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await expect(build).toBeFocused();
  await expect(build).toHaveAttribute("aria-expanded", "false");
  await page.setViewportSize({ width: 320, height: 740 });
  for (const label of ["Explore", "Review", "Build & connect"]) {
    await nav.getByRole("button", { name: label, exact: true }).click();
    await expect(nav.getByRole("link")).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }
  await nav.getByRole("link", { name: /MCP config/ }).click();
  await expect(page).toHaveURL(/\/settings\/mcp$/);
  await expect(nav.getByRole("link")).toHaveCount(0);
  await page.getByRole("link", { name: "SkaleAgents home" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("directory combines search and specialty filters and recovers from no matches", async ({ page }) => {
  await page.route("**/api/bots", (route) => route.fulfill({ json: { bots: [
    { id: "security", name: "Network reviewer", description: "Terraform access", specialty: "devsecops", visibility: "public", status: "published" },
    { id: "reliability", name: "Release reviewer", description: "Kubernetes health checks", specialty: "sre", visibility: "public", status: "published" },
  ] } }));
  await page.goto("/bots");
  await page.getByRole("searchbox").fill("reviewer");
  await page.getByRole("button", { name: "SRE", exact: true }).click();
  await expect(page.getByRole("link", { name: "Release reviewer" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Network reviewer" })).toHaveCount(0);
  await page.getByRole("searchbox").fill("nothing matches");
  await expect(page.getByRole("heading", { name: "No bots match that search" })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByRole("link", { name: "View prompt" })).toHaveCount(2);
});

test("prompt topics and search select the full text to copy", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const body = "Inspect readiness probes and explain how to validate recovery.";
  await page.route("**/api/prompts", (route) => route.fulfill({ json: { prompts: [
    { id: "1", title: "Release check", body, tags: ["sre"], ownerUserId: null },
    { id: "2", title: "Access check", body: "Review permissions", tags: ["security"], ownerUserId: null },
  ] } }));
  await page.goto("/prompts");
  await page.getByRole("button", { name: "sre", exact: true }).click();
  await page.getByRole("searchbox").fill("readiness");
  await expect(page.getByRole("heading", { name: "Access check" })).toHaveCount(0);
  await page.getByRole("button", { name: "Copy prompt", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(body);
});

test("Studio starter saves specialized instructions in a private draft", async ({ page }) => {
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  let saved: Record<string, unknown> = {};
  await page.route("**/api/bots", async (route) => {
    saved = route.request().postDataJSON();
    await route.fulfill({ status: 201, json: { ...saved, id: "starter", status: "draft" } });
  });
  await page.route("**/api/bots/starter", (route) => route.fulfill({ json: { ...saved, id: "starter", status: "draft" } }));
  await page.goto("/studio");
  await page.getByRole("combobox", { name: "Starter template" }).selectOption("1");
  await page.getByRole("button", { name: "Use starter" }).click();
  await expect(page.getByRole("textbox", { name: "Prompt body" })).toHaveValue(/Separate observed evidence from hypotheses/);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page).toHaveURL(/\/studio\/starter$/);
  expect(saved).toMatchObject({ specialty: "sre", visibility: "private", name: "Service reliability reviewer" });
});

test("schedule preset and timezone reach the API without altering the scope", async ({ page }) => {
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  let saved: Record<string, unknown> | null = null;
  await page.route("**/api/schedules", async (route) => {
    if (route.request().method() === "POST") {
      saved = route.request().postDataJSON();
      await route.fulfill({ status: 201, json: { ...saved, id: "schedule-1" } });
    } else await route.fulfill({ json: { schedules: [] } });
  });
  await page.goto("/schedules");
  await page.getByRole("button", { name: "Weekdays", exact: true }).click();
  await page.getByRole("combobox", { name: "Timezone" }).selectOption("Asia/Dhaka");
  await expect(page.getByRole("textbox", { name: "Cron expression" })).toHaveValue("0 9 * * 1-5");
  await expect(page.getByRole("status")).toContainText("Monday through Friday at 09:00 · Asia/Dhaka");
  await page.getByRole("textbox", { name: "Scheduled IaC content" }).fill("kind: Deployment");
  await page.getByRole("button", { name: "Create schedule", exact: true }).click();
  await expect.poll(() => saved).toMatchObject({ cronExpression: "0 9 * * 1-5", timezone: "Asia/Dhaka", scope: { content: "kind: Deployment" } });
});

test("audit specialist choices reach the API and job status filters work", async ({ page }) => {
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  let saved: Record<string, unknown> | null = null;
  await page.route("**/api/jobs", async (route) => {
    if (route.request().method() === "POST") {
      saved = route.request().postDataJSON();
      await route.fulfill({ status: 201, json: { id: "new-job" } });
    } else await route.fulfill({ json: { jobs: [{ id: "done", status: "completed", summary: "Review complete", specialists: ["sre"], createdAt: new Date().toISOString() }] } });
  });
  await page.goto("/jobs");
  await page.getByRole("textbox", { name: "IaC content", exact: true }).fill("kind: Deployment");
  await page.getByRole("checkbox", { name: /^Security/ }).uncheck();
  await page.getByRole("checkbox", { name: /^Scaling & cost/ }).check();
  await page.getByRole("button", { name: "Queue audit", exact: true }).click();
  await expect.poll(() => saved).toMatchObject({ specialists: ["sre", "scaling"], scope: { kind: "iac_text", content: "kind: Deployment" } });
  await page.getByRole("button", { name: /^failed/i }).click();
  await expect(page.getByText("Review complete", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: /^completed/i }).click();
  await expect(page.getByText("Review complete", { exact: true })).toBeVisible();
});

test("MCP setup is readable before sign-in and changes with the selected editor", async ({ page }) => {
  await page.goto("/settings/mcp");
  await expect(page.getByText(".cursor/mcp.json", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Claude Code", exact: true }).click();
  await expect(page.getByText("/mcp", { exact: true })).toBeVisible();
  await expect(page.locator("pre").first()).toContainText("claude mcp add --transport http skaleagents https://skaleagents.com/mcp");
  await expect(page.locator("pre").first()).not.toContainText("SKALEAGENTS_API_TOKEN");
  await expect(page.getByRole("button", { name: "Create token", exact: true })).toHaveCount(0);
});
