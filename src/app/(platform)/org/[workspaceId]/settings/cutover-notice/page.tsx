import { ScopedOrganizationCutover } from "@/components/organization-scope-views";
import { OrganizationScopeContent } from "@/components/organization-scope-content";

export const metadata = { title: "Organization notice | SkaleAgents" };

export default function OrganizationCutoverNoticePage() {
  return <OrganizationScopeContent personal={<main role="alert">This page is unavailable in Personal.</main>} team={<ScopedOrganizationCutover />} />;
}
