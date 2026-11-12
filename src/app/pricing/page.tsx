import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/page-metadata";
import { PricingPlans } from "@/components/pricing-plans";

export const metadata: Metadata = pageMetadata({ path: "/pricing", title: "Organization pricing | SkaleAgents", description: "Compare Free, Starter, Pro, Max, and Enterprise organization plans for infrastructure audits and monitoring, with the limits and billing for each plan." });

export default function PricingPage() {
  return <main>
    <div className="mb-11 border-b border-line pb-10">
      <p className="marketing-eyebrow">Organization plans / SkaleAgents</p>
      <h1 className="mt-4 max-w-2xl font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-tight tracking-tight">Choose your review rhythm.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">Start with individual audits. Add scheduled monitoring when your organization needs a repeatable review process.</p>
    </div>
    <p role="note" className="mb-7 border-l-2 border-accent bg-accent-soft px-5 py-4 text-sm leading-relaxed">Starter, Pro, and Max are organization plans. Prices exclude tax; Stripe adds any tax that applies at checkout. An owner chooses a plan for an organization they manage. Organization audits start 17 October 2026 at 00:00 UTC.</p>
    <PricingPlans />
    <section className="mt-12 border-t border-line pt-10" aria-labelledby="connect-ai-heading">
      <p className="marketing-eyebrow">Every plan / Works in your AI</p>
      <h2 id="connect-ai-heading" className="mt-3 font-display text-2xl font-semibold">Connect your AI and run a scan.</h2>
      <ol className="mt-6 grid gap-4 text-sm leading-relaxed md:grid-cols-3">
        <li className="border border-line bg-canvas-elevated p-5"><strong>1. Connect</strong><p className="mt-2 text-ink-muted">Add <code className="break-all text-ink">https://skaleagents.com/mcp</code> to Claude, Cursor, ChatGPT, or Codex, or install the Claude Code plugin. Sign in with Google and click Allow.</p></li>
        <li className="border border-line bg-canvas-elevated p-5"><strong>2. Ask for a scan</strong><p className="mt-2 text-ink-muted">Your AI sends the files it is working on and gets back each finding with the line to change.</p></li>
        <li className="border border-line bg-canvas-elevated p-5"><strong>3. Keep your audits</strong><p className="mt-2 text-ink-muted">Scans from your AI do not use your monthly audits. Each plan has its own monthly allowance of AI scans.</p></li>
      </ol>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-muted">Every account connects one AI client. On a paid plan, the organization&apos;s first owner connects more, and other members keep one each. <Link href="/mcp-config" className="font-semibold text-ink underline">Set up your AI</Link></p>
    </section>
  </main>;
}
