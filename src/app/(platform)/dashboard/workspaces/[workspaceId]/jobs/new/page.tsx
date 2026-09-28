import type { Metadata } from "next";
import { WorkspaceNewAuditView } from "@/components/workspace-audits-view";

export const metadata: Metadata = {
  title: "New shared audit | SkaleAgents",
  robots: { index: false, follow: false },
};

export default function NewWorkspaceAuditPage() {
  return <WorkspaceNewAuditView />;
}
