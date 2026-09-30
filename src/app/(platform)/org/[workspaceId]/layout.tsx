import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organization | SkaleAgents",
  robots: { index: false, follow: false },
};

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
