import { markdownPath } from "@/lib/ai-corpus";
import type { Metadata } from "next";
import Link from "next/link";
import { publicCheckAreas, publicCheckPath, publicChecks } from "@/lib/public-checks";

export const metadata: Metadata = {
  title: "Infrastructure review checks | SkaleAgents",
  description: "Read the built-in SkaleAgents review checks, the input each one needs, and what a result does not prove. No account required.",
  alternates: { canonical: "/checks", types: { "text/markdown": markdownPath("/checks") } },
};

export default function PublicChecksPage() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "SkaleAgents infrastructure review checks",
    itemListElement: publicChecks.map((check, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: check.title,
      url: `https://skaleagents.com${publicCheckPath(check)}`,
    })),
  };

  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replaceAll("<", "\\u003c") }} />
    <div className="mb-11 border-b border-line pb-10">
      <p className="marketing-eyebrow">Public reference / No account required</p>
      <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-tight tracking-tight">What a review actually checks.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">This page lists the checks a review can run. It does not run a review, connect to a cloud account, or prove that a system is secure.</p>
      <p className="mt-3 text-sm text-ink-muted">{publicChecks.length} checks. Open a check to read what it looks for.</p>
      <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
        <Link href="/dashboard/jobs" className="underline decoration-line underline-offset-4">Start a review</Link>
        <Link href="/mcp-config" className="underline decoration-line underline-offset-4">Set up MCP</Link>
      </p>
    </div>
    <div className="space-y-12">
      {publicCheckAreas.map((area) => {
        const checks = publicChecks.filter((check) => check.area === area);
        return (
          <section key={area} aria-labelledby={`checks-${area}`}>
            <h2 id={`checks-${area}`} className="text-lg font-semibold">{area} <span className="font-normal text-ink-muted">{checks.length}</span></h2>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {checks.map((check) => (
                <li key={check.slug} className="py-3">
                  <h3 className="font-semibold"><Link href={publicCheckPath(check)} className="hover:underline">{check.title}</Link></h3>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
    <section aria-labelledby="check-limits" className="mt-12 border-t border-line pt-10">
      <h2 id="check-limits" className="text-lg font-semibold">What a check cannot do</h2>
      <div className="mt-4 max-w-2xl space-y-2 text-sm leading-relaxed text-ink-muted">
        <p>It reads the text you submit. It does not call a cloud account.</p>
        <p>A value is resolved only when the literal is in the files you submit.</p>
        <p>No findings does not prove the system is secure.</p>
      </div>
    </section>
  </main>;
}
