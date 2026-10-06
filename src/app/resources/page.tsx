import { markdownPath } from "@/lib/ai-corpus";
import type { Metadata } from "next";
import Link from "next/link";
import { publicResourcePath, publicResources } from "@/lib/public-resources";

export const metadata: Metadata = {
  title: "Free resources | SkaleAgents",
  description: "Checklists and prompts for public exposure, wildcard IAM, and container privilege. Copy one or open it in your assistant. No account required.",
  alternates: { canonical: "/resources", types: { "text/markdown": markdownPath("/resources") } },
};

export default function ResourcesPage() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "SkaleAgents free resources",
    itemListElement: publicResources.map((resource, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: resource.title,
      url: `https://skaleagents.com${publicResourcePath(resource)}`,
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replaceAll("<", "\\u003c") }} />
      <div className="mb-11 border-b border-line pb-10">
        <p className="marketing-eyebrow">Free resources / No account required</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-tight tracking-tight">Checklists you can run tonight.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">Each page is a short list plus a prompt. Open it in Claude, ChatGPT, or another assistant, then paste the file you want reviewed.</p>
        <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
          <Link href="/prompts" className="underline decoration-line underline-offset-4">Prompt library</Link>
          <Link href="/blog" className="underline decoration-line underline-offset-4">Blog</Link>
          <Link href="/checks" className="underline decoration-line underline-offset-4">Review checks</Link>
        </p>
      </div>
      <ul className="divide-y divide-line">
        {publicResources.map((resource) => (
          <li key={resource.slug} className="py-6">
            <h2 className="text-xl font-semibold">
              <Link href={publicResourcePath(resource)} className="hover:underline">{resource.title}</Link>
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{resource.summary}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
