import type { Metadata } from "next";
import { WorkspacesView } from "@/components/workspaces-view";

export const metadata: Metadata = {
  title: "Workspaces | SkaleAgents",
  robots: { index: false, follow: false },
};

export default function WorkspacesPage() {
  return <WorkspacesView />;
}
