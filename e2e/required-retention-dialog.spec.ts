import { expect, test } from "./fixtures";

const orgId = "00000000-0000-4000-8000-000000000007";
const policy = { accountId: "owner", enabled: false, acknowledgementEnabled: true, version: "v1", notice: ["Audit input is removed after its retention deadline.", "Existing records receive at least 30 days from acknowledgement."], noticeDeliveredAt: null, legacyNotBefore: null, noticeArchived: false, noticeToken: "test-notice" };

test("dashboard queues notices, traps focus, and remembers acknowledgements across pages and reload", async ({ page }) => {
  const org = { id: orgId, name: "Test organization", kind: "team", role: "owner" };
  let accountArchived = false;
  let orgArchived = false;
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Test Owner" } }));
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: [org] } }));
  await page.route(`**/api/workspaces/${orgId}`, route => route.fulfill({ json: { data: org } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: { ...policy, noticeArchived: accountArchived } }));
  await page.route("**/api/account/retention/acknowledge", route => { accountArchived = true; return route.fulfill({ json: { ...policy, noticeArchived: true } }); });
  await page.route(`**/api/workspaces/${orgId}/retention`, route => route.fulfill({ json: { ...policy, workspaceId: orgId, automaticRetentionEnabled: false, noticeArchived: orgArchived } }));
  await page.route(`**/api/workspaces/${orgId}/retention/acknowledge`, route => { orgArchived = true; return route.fulfill({ json: { ...policy, workspaceId: orgId, noticeArchived: true } }); });
  await page.goto(`/org/${orgId}/settings`);
  const dialog = page.getByRole("dialog", { name: "Audit retention policy", exact: true });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await page.mouse.click(2, 2);
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "I acknowledge" })).toBeFocused();
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest("dialog")))).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(element => element.getBoundingClientRect().width <= innerWidth)).toBe(true);
  await page.screenshot({ path: "/private/tmp/skaleagents-retention-dialog-mobile.png" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: "/private/tmp/skaleagents-retention-dialog-desktop.png" });
  await dialog.getByRole("button", { name: "I acknowledge" }).click();
  const orgDialog = page.getByRole("dialog", { name: "Organization audit retention", exact: true });
  await expect(orgDialog).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await orgDialog.getByRole("button", { name: "I acknowledge" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Organization settings" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(accountArchived && orgArchived).toBe(true);
});

test("fresh member access cannot request or show the owner notice even with stale owner membership", async ({ page }) => {
  const org = { id: orgId, name: "Test organization", kind: "team", role: "owner" };
  let notices = 0;
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Test Owner" } }));
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: [org] } }));
  await page.route(`**/api/workspaces/${orgId}`, route => route.fulfill({ json: { data: { ...org, role: "member" } } }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: { ...policy, noticeArchived: true } }));
  await page.route(`**/api/workspaces/${orgId}/retention`, route => { notices++; return route.fulfill({ json: { ...policy, workspaceId: orgId } }); });
  await page.goto(`/org/${orgId}`);
  await expect(page.getByRole("heading", { name: "Test organization", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(notices).toBe(0);
});
