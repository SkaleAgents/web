import type { Metadata } from "next";
import { WorkspaceAuditsView } from "@/components/workspace-audits-view";

export const metadata: Metadata = {
  title: "Shared audits | SkaleAgents",
  robots: { index: false, follow: false },
};

export default function WorkspaceAuditsPage() {
  return <WorkspaceAuditsView />;
}
