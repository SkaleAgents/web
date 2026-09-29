import JobsPage from "@/app/(platform)/dashboard/jobs/page";
import { WorkspaceAuditsView } from "@/components/workspace-audits-view";
import { OrganizationScopeContent } from "@/components/organization-scope-content";

export default function OrganizationJobsPage() {
  return <OrganizationScopeContent personal={<JobsPage />} team={<WorkspaceAuditsView />} />;
}
