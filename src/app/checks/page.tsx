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
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">These pages describe the built-in checks in plain language. You can read them without signing in or paying. They do not run a review, connect to a cloud account, or prove that infrastructure is secure.</p>
    </div>
    <div className="space-y-12">
      {publicCheckAreas.map((area) => (
        <section key={area} aria-labelledby={`checks-${area}`}>
          <h2 id={`checks-${area}`} className="text-lg font-semibold">{area}</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {publicChecks.filter((check) => check.area === area).map((check) => (
              <li key={check.slug} className="py-5">
                <h3 className="font-semibold"><Link href={publicCheckPath(check)} className="hover:underline">{check.title}</Link></h3>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">{check.looksFor}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  </main>;
}
