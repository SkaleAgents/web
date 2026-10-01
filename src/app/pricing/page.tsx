import type { Metadata } from "next";
import { PricingPlans } from "@/components/pricing-plans";

export const metadata: Metadata = {
  title: "Organization pricing | SkaleAgents",
  description: "Compare Free, Starter, Pro, Max, and Enterprise organization plans for infrastructure audits and monitoring.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return <main>
    <div className="mb-11 border-b border-line pb-10">
      <p className="marketing-eyebrow">Organization plans / SkaleAgents</p>
      <h1 className="mt-4 max-w-2xl font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-tight tracking-tight">Choose your review rhythm.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">Start with individual audits. Add scheduled monitoring when your organization needs a repeatable review process.</p>
    </div>
    <p role="note" className="mb-7 border-l-2 border-accent bg-accent-soft px-5 py-4 text-sm leading-relaxed">Starter, Pro, and Max are organization plans. An owner chooses a plan for an organization they manage.</p>
    <PricingPlans />
  </main>;
}
