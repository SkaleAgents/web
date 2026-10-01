import type { Metadata } from "next";
import { PromptLibrary } from "@/components/prompt-library";
import { loadCommunityPrompts } from "@/lib/public-catalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Prompt library | SkaleAgents",
  description: "Read community prompts for infrastructure review and copy them into your assistant. No account required.",
  alternates: { canonical: "/prompts" },
};

export default async function PromptsPage() {
  const initialPrompts = await loadCommunityPrompts();
  return <PromptLibrary initialPrompts={initialPrompts} />;
}
