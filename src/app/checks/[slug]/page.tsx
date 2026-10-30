import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { articleJsonLd, jsonLd } from "@/lib/json-ld";
import { notFound } from "next/navigation";
import { publicCheckBySlug, publicCheckPath, publicCheckProposedChange, publicChecks } from "@/lib/public-checks";

export function generateStaticParams() {
  return publicChecks.map((check) => ({ slug: check.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const check = publicCheckBySlug((await params).slug);
  if (!check) return {};
  const path = publicCheckPath(check);
  return pageMetadata({
    path,
    title: `${check.title} | SkaleAgents review check`,
    description: check.looksFor,
    pad: `A SkaleAgents ${check.area} review check: the input it needs and what a result does not prove.`,
  });
}

export default async function PublicCheckPage({ params }: { params: Promise<{ slug: string }> }) {
  const check = publicCheckBySlug((await params).slug);
  if (!check) notFound();
  const proposedChange = publicCheckProposedChange(check);
  const article = { ...articleJsonLd({ title: check.title, description: check.looksFor, path: publicCheckPath(check) }), about: check.area };

  return <main className="max-w-3xl">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(article) }} />
    <p className="marketing-eyebrow">{check.area} / Public reference</p>
    <h1 className="mt-4 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-tight tracking-tight">{check.title}</h1>
    <p className="mt-5 text-lg leading-relaxed text-ink-muted">{check.looksFor}</p>
    <dl className="mt-10 space-y-6 border-t border-line pt-8 text-sm leading-relaxed">
      <div><dt className="font-semibold">What you need to supply</dt><dd className="mt-1 text-ink-muted">{check.needs}</dd></div>
      <div><dt className="font-semibold">If it reports a finding</dt><dd className="mt-1 text-ink-muted">{check.finding}</dd></div>
      <div><dt className="font-semibold">What this does not prove</dt><dd className="mt-1 text-ink-muted">{check.limit}</dd></div>
    </dl>
    <h2 className="mt-10 text-lg font-semibold">{check.exampleLabel}</h2>
    <pre className="mt-3 overflow-auto rounded-[10px] border border-line bg-canvas-elevated p-4 font-mono text-sm">{check.example}</pre>
    {proposedChange && <>
      <h2 className="mt-10 text-lg font-semibold">Proposed change</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">When this line appears once, the review proposes this change.</p>
      <pre className="mt-3 overflow-auto rounded-[10px] border border-line bg-canvas-elevated p-4 font-mono text-sm">{proposedChange}</pre>
    </>}
    <p className="mt-8 text-sm text-ink-muted"><Link href="/checks" className="font-semibold text-ink hover:underline">All review checks</Link>. Reading this page does not submit your infrastructure.</p>
  </main>;
}
