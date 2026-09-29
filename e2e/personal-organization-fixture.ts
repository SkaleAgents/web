import type { Page } from "@playwright/test";

export const personalOrganizationId = "0198f0b0-0000-7000-8000-000000000001";
export const personalOrganization = { id: personalOrganizationId, name: "Personal", kind: "personal", role: "owner", createdAt: "2026-09-29T00:00:00Z" };

export async function installPersonalOrganizationRoutes(page: Page) {
  await page.route("**/api/workspaces", route => route.fulfill({ json: { data: [personalOrganization] } }));
  await page.route(`**/api/workspaces/${personalOrganizationId}`, route => route.fulfill({ json: { data: personalOrganization } }));
}
