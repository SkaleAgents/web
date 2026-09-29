import { WorkspaceCutoverNoticeView } from "@/components/workspace-cutover-notice";
import { OrganizationScopeContent } from "@/components/organization-scope-content";

export default async function OrganizationCutoverNoticePage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  return <OrganizationScopeContent personal={<main role="alert">This page is unavailable in Personal.</main>} team={<WorkspaceCutoverNoticeView workspaceId={workspaceId} />} />;
}
