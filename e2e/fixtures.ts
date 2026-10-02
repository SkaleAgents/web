import { test as base, expect } from "@playwright/test";
import { installPersonalOrganizationRoutes } from "./personal-organization-fixture";

export const test = base.extend<{ personalOrganizationRoutes: void; cookieConsent: void }>({
  cookieConsent: [async ({ context, baseURL }, use) => {
    await context.addCookies([{ name: "skale_site_consent", value: "accepted", url: baseURL }]);
    await use();
  }, { auto: true }],
  personalOrganizationRoutes: [async ({ page }, use) => {
    await installPersonalOrganizationRoutes(page);
    await use();
  }, { auto: true }],
});

export { expect };
export type { Page } from "@playwright/test";
