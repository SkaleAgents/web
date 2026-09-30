import { ScopedOrganizationRetention } from "@/components/organization-scope-views";
import { OrganizationScopeContent } from "@/components/organization-scope-content";

export default function OrganizationRetentionPage() {
  return <OrganizationScopeContent personal={<main role="alert">This page is unavailable in Personal.</main>} team={<ScopedOrganizationRetention />} />;
}
