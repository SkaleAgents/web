import NewSchedulePage from "@/app/(platform)/dashboard/schedules/new/page";
import { OrganizationScopeContent } from "@/components/organization-scope-content";

export default function OrganizationNewSchedulePage() {
  return <OrganizationScopeContent personal={<NewSchedulePage />} />;
}
