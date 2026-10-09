import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = pageMetadata({ path: "/contact", title: "Contact SkaleAgents", description: "Get in touch about your SkaleAgents account, audits, billing, or organization plan. Email info@skaleagents.com and we reply by email." });

export default function ContactPage() {
  return <main className="mx-auto w-full max-w-3xl py-8 sm:py-14">
    <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-tight tracking-tight">Contact SkaleAgents</h1>
    <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">Questions about your account, an audit, billing, or your organization plan? Email us and tell us what you need help with.</p>
    <div className="mt-10 border-t border-line pt-8">
      <p className="text-sm text-ink-muted">Email</p>
      <a className="mt-2 block w-fit break-all font-display text-2xl font-semibold text-ink underline decoration-accent underline-offset-8 sm:text-3xl" href="mailto:info@skaleagents.com">info@skaleagents.com</a>
      <a className="mt-8 inline-flex min-h-11 items-center bg-accent px-6 py-3 text-sm font-semibold text-accent-fg hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" href="mailto:info@skaleagents.com">Email us</a>
      <p className="mt-3 text-sm text-ink-muted">This opens your email app.</p>
    </div>
  </main>;
}
