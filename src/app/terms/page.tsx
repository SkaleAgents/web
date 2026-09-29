import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Service | SkaleAgents", description: "Terms for using SkaleAgents." };

export default function TermsPage() {
  return <main className="policy-page py-4 text-ink">
    <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Effective September 29, 2026 · Version 2026-09-29</p>
    <h1 className="font-display text-4xl font-bold">SkaleAgents Terms of Service</h1>
    <p>SkaleAgents is operated by Binary Labs LLC, 1309 Coffeen Avenue, Sheridan, WY 82801, USA. Contact us at <a href="mailto:info@skaleagents.com">info@skaleagents.com</a>. These terms apply to the SkaleAgents website, accounts, dashboards, APIs, and MCP connections. Separate written terms may apply to human advisory engagements.</p>
    <h2>Accounts and organizations</h2>
    <p>You must be able to enter a binding agreement and keep your account information accurate. You are responsible for access to your account, tokens, connected tools, and organizations. Organization owners control membership and should invite only people authorized to see that organization&apos;s content.</p>
    <h2>Your content and permitted use</h2>
    <p>You keep ownership of code, prompts, configurations, and other material you submit. You grant us permission to host, process, and display that material only as needed to provide and protect the service. You must have the right to submit it. Do not use SkaleAgents to break the law, probe systems without permission, interfere with the service, or expose another person&apos;s data without authority.</p>
    <h2>Audits, agents, and connected tools</h2>
    <p>Audit findings, agent output, and suggested changes can be incomplete or wrong. Review them before relying on them or changing a live system. Connecting an external tool authorizes that tool to act within the access you grant. You can revoke tokens and connections in account settings. We do not promise that automated output will detect every issue or safely make changes on your behalf.</p>
    <h2>Plans and payment</h2>
    <p>Available features and limits depend on the plan shown when you subscribe. If a paid plan is offered, its checkout will show the price and billing interval before you confirm payment. Plan changes, cancellation, and refunds follow the terms shown at checkout and any applicable law. We may change future plan prices or features with notice; a change does not rewrite an already paid period.</p>
    <h2>Availability and suspension</h2>
    <p>We may update or pause the service for maintenance, security, or legal reasons. We may restrict access if we reasonably believe an account violates these terms or creates a security risk. Contact us if you believe a restriction was a mistake.</p>
    <h2>Ending use and disputes</h2>
    <p>You may stop using SkaleAgents and request account deletion by contacting us. Some records may be kept where required for security, billing, or legal reasons, as described in the <Link href="/privacy">Privacy Policy</Link>. Contact <a href="mailto:info@skaleagents.com">info@skaleagents.com</a> first about a dispute so we can try to resolve it. These terms are governed by the laws of Wyoming, USA, except where mandatory local consumer law applies.</p>
    <h2>Changes</h2>
    <p>We will post updated terms with a new effective date. If a material update requires renewed acceptance, we will ask you to agree before continuing to use private features.</p>
  </main>;
}
