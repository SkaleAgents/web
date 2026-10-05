import { markdownPath } from "@/lib/ai-corpus";
import type { Metadata } from "next";
import Link from "next/link";
import { publicCheckPath, publicChecks, type PublicCheck } from "@/lib/public-checks";

export const metadata: Metadata = {
  title: "Infrastructure review checks | SkaleAgents",
  description: "Read the built-in SkaleAgents review checks, the input each one needs, and what a result does not prove. No account required.",
  alternates: { canonical: "/checks", types: { "text/markdown": markdownPath("/checks") } },
};

const PAGE_SIZE = 10;

const checkFilters = [
  { slug: "all", label: "All", area: null },
  { slug: "security", label: "Security", area: "Security" },
  { slug: "reliability", label: "Reliability", area: "Reliability" },
  { slug: "ai-workloads", label: "AI workloads", area: "AI workloads" },
  { slug: "scaling-and-cost", label: "Scaling and cost", area: "Scaling and cost" },
] as const;

type CheckFilter = (typeof checkFilters)[number];
type CheckCategory = CheckFilter["slug"];

function selectedFilter(category: string | undefined): CheckFilter {
  return checkFilters.find((filter) => filter.slug === category) ?? checkFilters[0];
}

function selectedPage(page: string | undefined, pageCount: number): number {
  const parsed = Number(page);
  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return Math.min(parsed, pageCount);
}

function checksPageHref(category: CheckCategory, page: number): string {
  const query = new URLSearchParams();
  if (category !== "all") query.set("category", category);
  if (page > 1) query.set("page", String(page));
  const encoded = query.toString();
  return encoded ? `/checks?${encoded}` : "/checks";
}

function checksInFilter(filter: CheckFilter): PublicCheck[] {
  if (filter.area === null) return publicChecks;
  return publicChecks.filter((check) => check.area === filter.area);
}

export default async function PublicChecksPage({ searchParams }: { searchParams: Promise<{ category?: string; page?: string }> }) {
  const params = await searchParams;
  const filter = selectedFilter(params.category);
  const filtered = checksInFilter(filter);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = selectedPage(params.page, pageCount);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length);
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
      <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
        <Link href="/dashboard/jobs" className="underline decoration-line underline-offset-4">Start a review</Link>
        <Link href="/mcp-config" className="underline decoration-line underline-offset-4">Set up MCP</Link>
      </p>
    </div>
    <nav aria-label="Check categories" className="flex flex-wrap gap-2">
      {checkFilters.map((item) => {
        const active = item.slug === filter.slug;
        return (
          <Link
            key={item.slug}
            href={checksPageHref(item.slug, 1)}
            aria-current={active ? "page" : undefined}
            className={`inline-flex rounded-[10px] border px-3 py-1.5 text-sm font-semibold ${active ? "border-ink" : "border-line text-ink-muted"}`}
          >
            {item.label} {checksInFilter(item).length}
          </Link>
        );
      })}
    </nav>
    <p className="mt-6 text-sm text-ink-muted">Showing {rangeStart}{"\u2013"}{rangeEnd} of {filtered.length}</p>
    <ul className="mt-4 divide-y divide-line border-y border-line">
      {visible.map((check) => (
        <li key={check.slug} className="py-3">
          <h3 className="font-semibold"><Link href={publicCheckPath(check)} className="hover:underline">{check.title}</Link></h3>
        </li>
      ))}
    </ul>
    {pageCount > 1 && (
      <nav aria-label="Pagination" className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold">
        {page === 1 ? <span aria-disabled="true" className="text-ink-muted">Previous</span> : <Link href={checksPageHref(filter.slug, page - 1)} className="hover:underline">Previous</Link>}
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
          number === page
            ? <span key={number} aria-current="page">{number}</span>
            : <Link key={number} href={checksPageHref(filter.slug, number)} className="hover:underline">{number}</Link>
        ))}
        {page === pageCount ? <span aria-disabled="true" className="text-ink-muted">Next</span> : <Link href={checksPageHref(filter.slug, page + 1)} className="hover:underline">Next</Link>}
      </nav>
    )}
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
