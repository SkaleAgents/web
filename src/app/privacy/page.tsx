import { markdownPath } from "@/lib/ai-corpus";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | SkaleAgents",
  description: "How SkaleAgents handles account and product data.",
  alternates: { canonical: "/privacy", types: { "text/markdown": markdownPath("/privacy") } },
};

export default function PrivacyPage() {
  return <main className="policy-page py-4 text-ink">
    <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Effective October 1, 2026 · Version 2026-10-01</p>
    <h1 className="font-display text-4xl font-bold">SkaleAgents Privacy Policy</h1>
    <p>Binary Labs LLC, 1309 Coffeen Avenue, Sheridan, WY 82801, USA, operates SkaleAgents. For privacy requests, email <a href="mailto:info@skaleagents.com">info@skaleagents.com</a>. This policy covers the SkaleAgents website, account, dashboards, APIs, and MCP connections.</p>
    <h2>Information we process</h2>
    <p>We process account identifiers, email addresses, profile details, sign-in and security records, organization membership, invitations, API tokens, preferences, support messages, and service activity. When you use product features, we process the prompts, bot settings, audit inputs, findings, schedules, and other content you submit. Billing features may add purchase or invoice records. We receive limited identity information from a sign-in provider when you choose that provider.</p>
    <h2>Why we process it</h2>
    <p>We use this information to create and secure accounts, provide the features you request, deliver invitations and operational email, manage plans and billing, answer support requests, prevent abuse, and comply with legal duties. Where applicable, our bases are performance of a contract, legitimate interests in operating and securing the service, legal obligations, and consent for optional processing that requires it. Acknowledging this policy is not consent to unrelated marketing.</p>
    <h2>Service providers and transfers</h2>
    <p>Our hosting and database services run on Railway. Resend delivers account and invitation email. Google supplies sign-in identity when you choose Google. A payment provider may process checkout when paid plans are available. Connected AI and MCP services may receive the inputs needed for the features you activate. Providers process information under their own terms and our applicable arrangements. Information may be processed in the United States or other countries where these providers operate.</p>
    <h2>Retention and deletion</h2>
    <p>We keep account and organization data while needed to operate your account and meet security, billing, or legal obligations. You can request deletion or use available product controls to purge eligible audit inputs and history. Deletion of active application data does not necessarily remove the same data immediately from backups or provider logs. Automatic audit retention periods apply only when they are enabled for your account and shown in the product; do not assume every audit is deleted on a fixed timer. We retain a record of which policy versions you accepted for accountability.</p>
    <h2 id="cookies">Cookies</h2>
    <p>Visitors in the European Economic Area, the United Kingdom, and Switzerland see a cookie notice. Accept to stay on this site. Deny sends you to Google, because the site needs these cookies to run. Necessary cookies keep you signed in and protect form submissions. The cookie that remembers an acceptance is also necessary. If you accept optional cookies, this browser can remember a choice such as postponing the audit retention notice for 24 hours. Until you accept, a postponement lasts until you close the browser and is not stored in a cookie. We do not use advertising cookies. Visitors outside those countries do not see the notice.</p>
    <h2>Your choices and rights</h2>
    <p>You can edit some account and organization information in the dashboard, revoke connections and tokens, and request access, correction, export, or deletion by emailing us. You may also object to or request limits on certain processing where local law provides those rights. We may need to verify your identity and may retain information where the law allows or requires it. You can contact your local privacy regulator if a concern is unresolved.</p>
    <h2>Security and changes</h2>
    <p>We use access controls and operational safeguards to protect information, but no online service can guarantee absolute security. We will post changes here with a new effective date. For terms governing use of the service, see our <Link href="/terms">Terms of Service</Link>.</p>
  </main>;
}
