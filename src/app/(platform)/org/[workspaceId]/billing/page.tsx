import type { Metadata } from "next";
import { ScopedOrganizationBilling } from "@/components/organization-scope-views";
import { OrganizationScopeContent } from "@/components/organization-scope-content";

export const metadata: Metadata = {
  title: "Organization billing | SkaleAgents",
  robots: { index: false, follow: false },
};

export default async function OrganizationBillingPage({ searchParams }: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const query = await searchParams;
  return <OrganizationScopeContent personal={<main role="alert">Billing is unavailable for Personal.</main>}
    team={<ScopedOrganizationBilling checkoutReturn={query.checkout === "return"} />} />;
}
