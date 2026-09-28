import type { Metadata } from "next";
import { WorkspaceRetentionNoticeView } from "@/components/workspace-retention-notice";

export const metadata: Metadata = {
  title: "Organization retention | SkaleAgents",
  robots: { index: false, follow: false },
};

export default async function WorkspaceRetentionPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  return <WorkspaceRetentionNoticeView workspaceId={workspaceId} />;
}
