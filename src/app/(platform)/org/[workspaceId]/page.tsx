import { ScopedOrganizationOverview } from "@/components/organization-scope-views";
import PersonalOverview from "@/app/(platform)/dashboard/page";
import { OrganizationScopeContent } from "@/components/organization-scope-content";

export default function OrganizationPage() {
  return <OrganizationScopeContent personal={<PersonalOverview />} team={<ScopedOrganizationOverview />} />;
}
