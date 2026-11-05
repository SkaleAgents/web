import type { Metadata } from "next";
import { ScopedOrganizationBilling } from "@/components/organization-scope-views";
import { OrganizationScopeContent } from "@/components/organization-scope-content";
import { OrganizationBillingView } from "@/components/organization-billing-view";

export const metadata: Metadata = {
  title: "Organization billing | SkaleAgents",
  robots: { index: false, follow: false },
};

export default async function OrganizationBillingPage({ searchParams }: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const query = await searchParams;
  return <OrganizationScopeContent personal={<OrganizationBillingView />}
    team={<ScopedOrganizationBilling checkoutReturn={query.checkout === "return"} />} />;
}
