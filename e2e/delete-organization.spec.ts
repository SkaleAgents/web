import { expect, test } from "./fixtures";

const id = "0198f0b0-0000-7000-8000-000000000002";
const pid = "0198f0b0-0000-7000-8000-000000000001";
const team = { id, slug: "binary-labs", name: "Binary Labs", kind: "team", role: "owner" };
const personal = { id: pid, slug: "personal", name: "Personal", kind: "personal", role: "owner" };

test("owners delete an organization after typing its name; blockers are listed", async ({ page }) => {
  let attempts = 0;
  let deleted = false;
  await page.route("**/api/user", route => route.fulfill({ json: { id: "o", displayName: "Owner", email: "o@example.test" } }));
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/workspaces**", route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/workspaces") return route.fulfill({ json: { data: deleted ? [personal] : [personal, team] } });
    if (path === `/api/workspaces/${id}` && route.request().method() === "DELETE") {
      expect(route.request().postDataJSON()).toEqual({ name: "Binary Labs" });
      if (++attempts === 1) return route.fulfill({ status: 409, json: { message: "This organization can't be deleted yet.", blockers: ["Delete the organization's 3 audits first."] } });
      deleted = true;
      return route.fulfill({ json: { deleted: true } });
    }
    if (path === `/api/workspaces/${id}`) return route.fulfill({ json: { data: team } });
    if (path === `/api/workspaces/${pid}`) return route.fulfill({ json: { data: personal } });
    return route.fulfill({ json: { data: [] } });
  });
  await page.route("**/api/{jobs,schedules,bots}", route => route.fulfill({ json: { jobs: [], schedules: [], bots: [] } }));
  await page.goto("/org/binary-labs/settings");
  const button = page.getByRole("button", { name: "Delete organization" });
  await expect(button).toBeDisabled();
  await page.getByLabel(/to confirm/).fill("Binary Labs");
  await button.click();
  await expect(page.getByRole("alert").filter({ hasText: "can't be deleted yet" })).toContainText("Delete the organization's 3 audits first.");
  await button.click();
  await expect(page.getByText("Binary Labs was deleted.")).toBeVisible();
  await expect(page).toHaveURL(/\/org\/personal$/);
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(page.getByRole("link", { name: "Dashboard", exact: true }).locator("svg rect")).toHaveCount(4);
});
