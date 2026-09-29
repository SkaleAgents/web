import NewAuditPage from "@/app/(platform)/dashboard/jobs/new/page";
import { WorkspaceNewAuditView } from "@/components/workspace-audits-view";
import { OrganizationScopeContent } from "@/components/organization-scope-content";

export default function NewOrganizationAuditPage() {
  return <OrganizationScopeContent personal={<NewAuditPage />} team={<WorkspaceNewAuditView />} />;
}
