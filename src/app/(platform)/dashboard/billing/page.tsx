import type { Metadata } from "next";
import { OrganizationBillingView } from "@/components/organization-billing-view";

export const metadata: Metadata = {
  title: "Organization billing | SkaleAgents",
  robots: { index: false, follow: false },
};

export default function BillingPage() {
  return <OrganizationBillingView />;
}
