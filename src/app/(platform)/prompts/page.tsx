import { PromptLibrary } from "@/components/prompt-library";
import { loadCommunityPrompts } from "@/lib/public-catalog";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({ path: "/prompts", title: "Prompt library | SkaleAgents", description: "Read community prompts for infrastructure review and copy them into your assistant. No account required." });

export default async function PromptsPage() {
  const initialPrompts = await loadCommunityPrompts();
  return <PromptLibrary initialPrompts={initialPrompts} />;
}
