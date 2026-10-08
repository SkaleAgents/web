import { markdownPath } from "@/lib/ai-corpus";
import { BotPromptActions } from "@/components/bot-prompt-actions";
import { absoluteMarkdown } from "@/lib/site-url";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicResourceBySlug, publicResourcePath, publicResources } from "@/lib/public-resources";

export function generateStaticParams() {
  return publicResources.map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resource = publicResourceBySlug((await params).slug);
  if (!resource) return {};
  const path = publicResourcePath(resource);
  return {
    title: `${resource.title} | SkaleAgents`,
    description: resource.summary,
    alternates: { canonical: path, types: { "text/markdown": markdownPath(path) } },
    openGraph: { title: resource.title, description: resource.summary, url: path },
  };
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const resource = publicResourceBySlug((await params).slug);
  if (!resource) notFound();
  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: resource.title,
    description: resource.summary,
    url: `https://skaleagents.com${publicResourcePath(resource)}`,
    step: resource.checklist.map((text, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      text,
    })),
  };

  return (
    <main className="max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo).replaceAll("<", "\\u003c") }} />
      <p className="marketing-eyebrow">Free resource / No account required</p>
      <h1 className="mt-4 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-tight tracking-tight">{resource.title}</h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-muted">{resource.summary}</p>
      <p className="mt-4 text-sm leading-relaxed text-ink-muted">{resource.audience}</p>
      <h2 className="mt-10 text-lg font-semibold">What you should get</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{resource.outcome}</p>
      <h2 className="mt-10 text-lg font-semibold">Checklist</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink">
        {resource.checklist.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <div className="mt-10 flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-lg font-semibold">{resource.promptTitle}</h2>
        <BotPromptActions
          title={resource.promptTitle}
          prompt={resource.prompt}
          markdownUrl={absoluteMarkdown(publicResourcePath(resource))}
        />
      </div>
      <pre className="mt-3 whitespace-pre-wrap break-words rounded-[10px] border border-line bg-canvas-elevated p-4 font-mono text-sm leading-6">{resource.prompt}</pre>
      <p className="mt-8 text-sm text-ink-muted">
        <Link href="/resources" className="font-semibold text-ink hover:underline">All free resources</Link>
        <span aria-hidden="true"> · </span>
        <Link href="/prompts" className="font-semibold text-ink hover:underline">Prompt library</Link>
        . Reading this page does not submit your infrastructure.
      </p>
    </main>
  );
}
