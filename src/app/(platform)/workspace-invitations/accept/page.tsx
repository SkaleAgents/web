import type { Metadata } from "next";
import { WorkspaceInvitationView } from "@/components/workspace-invitation-view";

export const metadata: Metadata = {
  title: "Accept workspace invitation | SkaleAgents",
  robots: { index: false, follow: false },
};

export default function WorkspaceInvitationPage() {
  return <WorkspaceInvitationView />;
}
