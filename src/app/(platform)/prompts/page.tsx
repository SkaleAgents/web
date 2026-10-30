import { PromptLibrary } from "@/components/prompt-library";
import { loadCommunityPrompts } from "@/lib/public-catalog";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import { articleJsonLd, itemListJsonLd, jsonLd } from "@/lib/json-ld";
import { SITE } from "@/lib/site-url";

export const revalidate = 300;

const description = "Read community prompts for infrastructure review and copy them into your assistant. No account required.";

export const metadata: Metadata = pageMetadata({ path: "/prompts", title: "Prompt library | SkaleAgents", description });

export default async function PromptsPage() {
  const initialPrompts = await loadCommunityPrompts();
  const items = (initialPrompts ?? []).map((prompt) => ({ name: prompt.title, url: `${SITE}/prompts/${prompt.id}` }));
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([articleJsonLd({ title: "Prompt library", description, path: "/prompts" }), itemListJsonLd(items)]) }} />
    <PromptLibrary initialPrompts={initialPrompts} />
  </>;
}
