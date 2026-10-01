import { markdownPath } from "@/lib/ai-corpus";
import { PromptLibrary } from "@/components/prompt-library";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prompt library | SkaleAgents",
  description: "Search community prompts and copy the instructions. Sign in to save your own.",
  alternates: { canonical: "/prompts", types: { "text/markdown": markdownPath("/prompts") } },
};

export default function PromptsPage() {
  return <PromptLibrary />;
}
