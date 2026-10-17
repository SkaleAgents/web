import type { Metadata } from "next";
import { ContactEmailReveal } from "@/components/contact-email-reveal";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = pageMetadata({ path: "/contact", title: "Contact SkaleAgents", description: "Get in touch about your SkaleAgents account, audits, billing, or organization plan. We reply by email." });

export default function ContactPage() {
  return <main className="mx-auto w-full max-w-3xl py-8 sm:py-14">
    <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-tight tracking-tight">Contact SkaleAgents</h1>
    <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">Questions about your account, an audit, billing, or your organization plan? Email us and tell us what you need help with.</p>
    <div className="mt-10 border-t border-line pt-8">
      <p className="mb-4 text-sm text-ink-muted">We show our email address after a quick check that keeps spam bots out.</p>
      <ContactEmailReveal />
    </div>
  </main>;
}
