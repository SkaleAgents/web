import type { Metadata } from "next";
import { PromptDetail } from "@/components/prompt-detail";
import { markdownPath } from "@/lib/ai-corpus";
import { loadCommunityPrompt } from "@/lib/public-catalog";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const prompt = await loadCommunityPrompt((await params).id);
  if (!prompt) return { title: "Prompt | SkaleAgents" };
  const description = prompt.body.replace(/\s+/g, " ").slice(0, 160);
  return {
    title: `${prompt.title} | SkaleAgents prompt`,
    description,
    alternates: { canonical: `/prompts/${prompt.id}`, types: { "text/markdown": markdownPath(`/prompts/${prompt.id}`) } },
  };
}

export default async function PromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initialPrompt = await loadCommunityPrompt(id);
  return <PromptDetail initialPrompt={initialPrompt} />;
}
