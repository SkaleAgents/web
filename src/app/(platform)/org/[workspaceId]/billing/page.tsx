import type { Metadata } from "next";
import { OrganizationBillingView } from "@/components/organization-billing-view";
import { OrganizationScopeContent } from "@/components/organization-scope-content";

export const metadata: Metadata = {
  title: "Organization billing | SkaleAgents",
  robots: { index: false, follow: false },
};

export default async function OrganizationBillingPage({ params, searchParams }: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  const [{ workspaceId }, query] = await Promise.all([params, searchParams]);
  return <OrganizationScopeContent personal={<main role="alert">Billing is unavailable for Personal.</main>}
    team={<OrganizationBillingView organizationId={workspaceId} checkoutReturnOrganizationId={query.checkout === "return" ? workspaceId : null} />} />;
}
