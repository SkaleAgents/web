import type { Metadata } from "next";
import { OrganizationBillingView } from "@/components/organization-billing-view";

export const metadata: Metadata = {
  title: "Organization billing | SkaleAgents",
  robots: { index: false, follow: false },
};

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string; organization?: string }> }) {
  const params = await searchParams;
  return <OrganizationBillingView checkoutReturnOrganizationId={params.checkout === "return" && typeof params.organization === "string" ? params.organization : null} />;
}
