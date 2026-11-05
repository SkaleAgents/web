import type { Metadata } from "next";
import { ScopedOrganizationBilling } from "@/components/organization-scope-views";

export const metadata: Metadata = {
  title: "Billing | SkaleAgents",
  robots: { index: false, follow: false },
};

export default async function OrganizationBillingPage({ searchParams }: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const query = await searchParams;
  return <ScopedOrganizationBilling checkoutReturn={query.checkout === "return"} />;
}
