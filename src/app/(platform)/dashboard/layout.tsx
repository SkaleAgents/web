import type { Metadata } from "next";
import { PasskeyPrompt } from "@/components/passkey-prompt";

export const metadata: Metadata = {
  title: "Dashboard | SkaleAgents",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <><PasskeyPrompt />{children}</>;
}
