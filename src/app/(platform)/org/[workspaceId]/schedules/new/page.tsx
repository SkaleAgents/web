import NewSchedulePage from "@/app/(platform)/dashboard/schedules/new/page";
import { OrganizationScopeContent } from "@/components/organization-scope-content";

export const metadata = { title: "Add a schedule | SkaleAgents" };

export default function OrganizationNewSchedulePage() {
  return <OrganizationScopeContent personal={<NewSchedulePage />} />;
}
