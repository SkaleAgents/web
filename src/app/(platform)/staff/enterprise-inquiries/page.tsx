import type { Metadata } from "next";
import { EnterpriseInquiries } from "@/components/enterprise-inquiries";

export const metadata: Metadata = {
  title: "Enterprise inquiries | SkaleAgents",
  robots: { index: false, follow: false },
};

export default function EnterpriseInquiriesPage() {
  return <EnterpriseInquiries />;
}
