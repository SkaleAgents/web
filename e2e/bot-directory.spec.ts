import { test, expect } from "@playwright/test";

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
  let bot: Record<string, unknown> | null = null;

  await page.route("**/api/user", (route) => route.fulfill({ json: user }));
  await page.route("**/sanctum/csrf-cookie", (route) =>
    route.fulfill({ status: 204 }),
  );
  await page.route("**/api/bots", async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      const body = JSON.parse(request.postData() ?? "{}");
      bot = {
        id: botId,
        ownerUserId: user.id,
        name: body.name,
        description: body.description,
        specialty: body.specialty,
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
  await page
    .getByRole("textbox", { name: "Prompt body" })
    .fill("Review secure defaults and explain the highest-impact remediation.");
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
});
