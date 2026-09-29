import SchedulesPage from "@/app/(platform)/dashboard/schedules/page";
import { WorkspaceSchedulesView } from "@/components/workspace-schedules-view";
import { OrganizationScopeContent } from "@/components/organization-scope-content";

export default function OrganizationSchedulesPage() {
  return <OrganizationScopeContent personal={<SchedulesPage />} team={<WorkspaceSchedulesView />} />;
}
