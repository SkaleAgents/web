import { test, expect } from "./fixtures";

test("a signed-in creator can publish a bot into the directory", async ({ page }) => {
  const user = {
    id: "00000000-0000-4000-8000-000000000011",
    displayName: "Directory Owner",
    email: "directory@example.com",
    grokLinked: false,
  };
  const botId = "00000000-0000-4000-8000-000000000021";
  const botName = "Directory Acceptance Bot";
  const description = "Finds risky defaults before they reach production.";
  const prompt = "Review secure defaults and explain the highest-impact remediation.";
  let bot: Record<string, unknown> | null = null;

  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copiedPrompt?: string }).copiedPrompt = text;
        },
      },
    });
  });
  await page.route("**/api/user", (route) => route.fulfill({ json: user }));
  await page.route("**/sanctum/csrf-cookie", (route) =>
    route.fulfill({ status: 204 }),
  );
  await page.route("**/api/bots", async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      const body = JSON.parse(request.postData() ?? "{}");
      expect(body.integrations).toEqual(["github"]);
      bot = {
        id: botId,
        ownerUserId: user.id,
        name: body.name,
        description: body.description,
        specialty: body.specialty,
        integrations: body.integrations,
        promptBody: body.promptBody,
        visibility: body.visibility,
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await route.fulfill({ status: 201, json: bot });
      return;
    }

    await route.fulfill({ json: { bots: bot?.status === "published" ? [bot] : [] } });
  });
  await page.route(`**/api/bots/${botId}`, async (route) => {
    const request = route.request();
    if (request.method() === "PATCH") {
      const body = JSON.parse(request.postData() ?? "{}");
      bot = { ...bot, ...body };
      await route.fulfill({ json: bot });
      return;
    }

    if (request.method() === "POST" && route.request().url().endsWith("/publish")) {
      bot = { ...bot, status: "published" };
      await route.fulfill({ json: bot });
      return;
    }

    await route.fulfill({ json: bot });
  });
  await page.route(`**/api/bots/${botId}/publish`, async (route) => {
    bot = { ...bot, status: "published" };
    await route.fulfill({ json: bot });
  });

  await page.goto("/studio");
  await page.getByRole("textbox", { name: "Name" }).fill(botName);
  await page.getByRole("textbox", { name: "Description" }).fill(description);
  await page.getByRole("combobox", { name: "Specialty" }).selectOption("devsecops");
  await page.getByRole("checkbox", { name: "GitHub" }).check();
  await page.getByRole("textbox", { name: "Prompt body" }).fill(prompt);
  await page.getByRole("combobox", { name: "Visibility" }).selectOption("public");
  await page.getByRole("button", { name: "Save draft" }).click();

  await expect(page).toHaveURL(new RegExp(`/studio/${botId}$`));
  await page.getByRole("button", { name: "Publish" }).click();

  await expect(page).toHaveURL(/\/bots$/);
  await expect(page.getByRole("link", { name: botName })).toBeVisible();
  await expect(page.getByText("devsecops", { exact: true })).toBeVisible();
  await expect(page.getByText("public", { exact: true })).toBeVisible();
  await expect(page.getByText("published", { exact: true })).toBeVisible();
  await expect(page.getByText(description)).toBeVisible();
  await expect(page.getByRole("link", { name: "View prompt" })).toHaveAttribute(
    "href",
    `/org/0198f0b0-0000-7000-8000-000000000001/bots/${botId}`,
  );
  await expect(page.getByText(prompt)).not.toBeVisible();
  await expect(page.getByRole("link", { name: botName })).toHaveAttribute(
    "href",
    `/org/0198f0b0-0000-7000-8000-000000000001/bots/${botId}`,
  );
  await page.getByRole("link", { name: botName }).click();
  await expect(page).toHaveURL(new RegExp(`/bots/${botId}$`));
  await expect(page.getByRole("heading", { name: botName })).toBeVisible();
  await expect(page.getByText(prompt)).toBeVisible();
  await expect(page.getByRole("button", { name: "Actions" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Open in / })).toHaveCount(0);
  await page.getByRole("button", { name: "Actions" }).click();
  const menu = page.getByRole("menu");
  await expect(menu.getByRole("menuitem", { name: /^Open in / })).toHaveCount(5);
  await expect(menu.getByRole("menuitem", { name: /^Grok / })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: /^Grokbot/ })).toBeVisible();
  expect(new URL(await menu.getByRole("menuitem", { name: "Open in Claude" }).getAttribute("href") ?? "").searchParams.get("q")).toBe(prompt);
  expect(new URL(await menu.getByRole("menuitem", { name: "Open in ChatGPT" }).getAttribute("href") ?? "").searchParams.get("q")).toBe(prompt);
  await expect(menu.getByRole("menuitem", { name: "Open in Codex" })).toHaveAttribute("href", "https://chatgpt.com/codex");
  await expect(menu.getByRole("menuitem", { name: "Open in Gemini" })).not.toHaveAttribute("href", /.+/);
  await menu.getByRole("menuitem", { name: "Copy plain text" }).click();
  await expect(
    page.getByText("Prompt copied. Paste it into any assistant."),
  ).toBeVisible();
  expect(
    await page.evaluate(() => (window as unknown as { copiedPrompt?: string }).copiedPrompt),
  ).toBe(prompt);
});

test("a visitor filters bots by tool and opens the assistant actions", async ({ page }) => {
  const github = {
    id: "00000000-0000-4000-8000-000000000031",
    ownerUserId: "00000000-0000-4000-8000-000000000041",
    name: "Pull request risk reviewer",
    description: "Reviews a pasted pull request diff.",
    specialty: "devops",
    integrations: ["github"],
    promptBody: "Review the pasted diff and quote the risky hunk.",
    visibility: "public",
    status: "published",
    createdAt: "2026-10-06T00:00:00Z",
    updatedAt: "2026-10-06T00:00:00Z",
  };
  const slack = {
    ...github,
    id: "00000000-0000-4000-8000-000000000032",
    name: "Incident thread reader",
    description: "Reads a pasted incident thread.",
    specialty: "sre",
    integrations: ["slack"],
    promptBody: "Read the pasted thread.",
  };

  await page.route("**/api/user", (route) => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/bots", (route) => route.fulfill({ json: { bots: [github, slack] } }));
  await page.route(`**/api/bots/${github.id}`, (route) => route.fulfill({ json: github }));

  await page.goto("/bots");
  await expect(page).toHaveURL(/\/bot-directory$/);
  await page.getByRole("link", { name: github.name }).click();
  await expect(page).toHaveURL(new RegExp(`/bot-directory/${github.id}$`));
  await expect(page.getByRole("heading", { name: github.name })).toBeVisible();
  await expect(page.getByText(github.promptBody)).toBeVisible();
  await page.getByRole("button", { name: "Actions" }).click();
  const menu = page.getByRole("menu");
  await expect(menu.getByRole("menuitem", { name: /^Open in / })).toHaveCount(5);
  await expect(menu.getByRole("menuitem", { name: /^Grok / })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: /^Grokbot/ })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Copy plain text" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "How to use it" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "More reviewers" })).toBeVisible();
  await expect(page.getByRole("link", { name: slack.name })).toBeVisible();
  await page.getByRole("link", { name: "DevOps" }).first().click();
  await expect(page).toHaveURL(/\/bot-directory\/specialties\/devops$/);
  await expect(page.getByRole("heading", { name: "DevOps reviewers" })).toBeVisible();
  await expect(page.getByRole("link", { name: github.name })).toBeVisible();
  await expect(page.getByRole("link", { name: slack.name })).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/bot-directory");
  await expect(page.getByRole("heading", { name: "Bot directory" })).toBeVisible();
  await expect(page.getByRole("link", { name: github.name })).toBeVisible();
  await expect(page.getByRole("link", { name: slack.name })).toBeVisible();
  const tools = page.locator('[aria-label="Filter by tool"]');
  await expect(tools).toBeVisible();
  expect(await tools.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);

  await tools.getByRole("button", { name: /^Tool/ }).click();
  await page.getByRole("option", { name: "GitHub", exact: true }).click();
  await expect(page.getByRole("link", { name: slack.name })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "GitHub", exact: true }).click();
  await expect(page).toHaveURL(/\/bot-directory\/integrations\/github$/);
  await page.goto("/bots/integrations/github");
  await expect(page).toHaveURL(/\/bot-directory\/integrations\/github$/);
  await expect(page.getByRole("heading", { name: "GitHub bots" })).toBeVisible();
  await expect(page.getByRole("link", { name: github.name })).toBeVisible();
  await expect(page.getByRole("link", { name: slack.name })).toHaveCount(0);
});

test("a visitor pages the directory twenty reviewers at a time", async ({ page }) => {
  const bots = Array.from({ length: 21 }, (_, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    ownerUserId: "00000000-0000-4000-8000-000000000041",
    name: `Reviewer ${String(index + 1).padStart(2, "0")}`,
    description: "Reviews a pasted change.",
    specialty: index === 20 ? "sre" : "devops",
    integrations: ["github"],
    promptBody: "Review the pasted change.",
    visibility: "public",
    status: "published",
    createdAt: "2026-10-06T00:00:00Z",
    updatedAt: "2026-10-06T00:00:00Z",
  }));

  await page.route("**/api/user", (route) => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/bots", (route) => route.fulfill({ json: { bots } }));

  await page.goto("/bot-directory");
  await expect(page.getByText(/Showing 1.20 of 21/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Reviewer 01" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Reviewer 20" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Reviewer 21" })).toHaveCount(0);

  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText(/Showing 21.21 of 21/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Reviewer 21" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Reviewer 01" })).toHaveCount(0);

  await page.getByRole("button", { name: "Previous" }).click();
  await expect(page.getByRole("link", { name: "Reviewer 01" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Reviewer 21" })).toHaveCount(0);

  await page.getByRole("button", { name: "Next" }).click();
  await page.locator('[aria-label="Filter by specialty"]').getByRole("button").click();
  await page.getByRole("option", { name: "SRE", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("link", { name: "Reviewer 21" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Reviewer 01" })).toHaveCount(0);
  await expect(page.getByText(/Showing 1.1 of 1/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0);
});
