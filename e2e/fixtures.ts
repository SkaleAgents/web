import { test as base, expect } from "@playwright/test";
import { installPersonalOrganizationRoutes } from "./personal-organization-fixture";

export const test = base.extend<{ personalOrganizationRoutes: void }>({
  personalOrganizationRoutes: [async ({ page }, use) => {
    await installPersonalOrganizationRoutes(page);
    await use();
  }, { auto: true }],
});

export { expect };
export type { Page } from "@playwright/test";
