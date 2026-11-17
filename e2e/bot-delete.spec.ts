import { test, expect } from "./fixtures";

test("an owner can delete their bot from Studio after confirming", async ({ page }) => {
  const user = { id: "00000000-0000-4000-8000-000000000011", displayName: "Bot Owner", email: "owner@example.com", grokLinked: false };
  const botId = "00000000-0000-4000-8000-000000000031";
  let deleted = false;
  const bot = { id: botId, ownerUserId: user.id, name: "Doomed Bot", description: "x", specialty: "general", integrations: [], promptBody: "Review it.", visibility: "private", status: "draft", createdAt: "2026-11-17T00:00:00Z", updatedAt: "2026-11-17T00:00:00Z" };
  const dialogs: string[] = [];

  await page.route("**/api/user", (route) => route.fulfill({ json: user }));
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/bots", (route) => route.fulfill({ json: { bots: deleted ? [] : [bot] } }));
  await page.route(`**/api/bots/${botId}`, async (route) => {
    if (route.request().method() === "DELETE") { deleted = true; await route.fulfill({ status: 204 }); return; }
    await route.fulfill({ json: bot });
  });

  await page.goto(`/dashboard/studio/${botId}`);
  await expect(page.getByLabel("Name")).toHaveValue("Doomed Bot");

  page.once("dialog", (dialog) => { dialogs.push(dialog.message()); void dialog.dismiss(); });
  await page.getByRole("button", { name: "Delete bot" }).click();
  expect(deleted).toBe(false);
  expect(dialogs[0]).toContain("Doomed Bot");

  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Delete bot" }).click();
  await expect.poll(() => deleted).toBe(true);
  await expect(page).not.toHaveURL(new RegExp(botId));
});
