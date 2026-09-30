import { ScopedOrganizationSettings } from "@/components/organization-scope-views";
import { OrganizationScopeContent } from "@/components/organization-scope-content";
import { AccountSettingsRedirect } from "@/components/account-settings-redirect";

export default function OrganizationSettingsPage() {
  return <OrganizationScopeContent personal={<AccountSettingsRedirect />} team={<ScopedOrganizationSettings />} />;
}
