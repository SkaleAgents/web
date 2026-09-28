import type { Metadata } from "next";
import { WorkspaceSchedulesView } from "@/components/workspace-schedules-view";

export const metadata: Metadata = {
  title: "Shared schedules | SkaleAgents",
  robots: { index: false, follow: false },
};

export default function WorkspaceSchedulesPage() {
  return <WorkspaceSchedulesView />;
}
