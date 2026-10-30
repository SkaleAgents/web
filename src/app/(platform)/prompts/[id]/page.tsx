import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import { PromptDetail } from "@/components/prompt-detail";
import Link from "next/link";
import { articleJsonLd, jsonLd, productJsonLd } from "@/lib/json-ld";
import { communityPrompts, loadCommunityPrompt, loadCommunityPrompts } from "@/lib/public-catalog";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const prompt = await loadCommunityPrompt((await params).id);
  if (!prompt) return { title: "Prompt | SkaleAgents" };
  return pageMetadata({
    path: `/prompts/${prompt.id}`,
    title: `${prompt.title} | SkaleAgents prompt`,
    description: prompt.body,
    pad: "Copy this community prompt into your assistant.",
  });
}

export default async function PromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initialPrompt = await loadCommunityPrompt(id);
  const others = communityPrompts((await loadCommunityPrompts()) ?? []).filter((prompt) => prompt.id !== id).slice(0, 4);
  const page = initialPrompt ? { title: initialPrompt.title, description: initialPrompt.body.slice(0, 300), path: `/prompts/${initialPrompt.id}`, datePublished: initialPrompt.createdAt } : null;
  return <>
    {page ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([articleJsonLd(page), productJsonLd(page)]) }} /> : null}
    <PromptDetail initialPrompt={initialPrompt} />
    {others.length > 0 ? <div className="mt-10">
      <h2 className="text-lg font-semibold">More prompts</h2>
      <ul className="mt-3 space-y-2 text-sm font-semibold">
        {others.map((prompt) => <li key={prompt.id}><Link href={`/prompts/${prompt.id}`} className="underline decoration-line underline-offset-4">{prompt.title}</Link></li>)}
      </ul>
    </div> : null}
  </>;
}
