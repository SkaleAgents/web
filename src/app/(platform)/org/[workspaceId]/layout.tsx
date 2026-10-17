import type { Metadata } from "next";
import { PasskeyPrompt } from "@/components/passkey-prompt";

export const metadata: Metadata = {
  title: "Organization | SkaleAgents",
  robots: { index: false, follow: false },
};

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  return <><PasskeyPrompt />{children}</>;
}
