import { WorkspaceRetentionNoticeView } from "@/components/workspace-retention-notice";
import { OrganizationScopeContent } from "@/components/organization-scope-content";

export default async function OrganizationRetentionPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  return <OrganizationScopeContent personal={<main role="alert">This page is unavailable in Personal.</main>} team={<WorkspaceRetentionNoticeView workspaceId={workspaceId} />} />;
}
