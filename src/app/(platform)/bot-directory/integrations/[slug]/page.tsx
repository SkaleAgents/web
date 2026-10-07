import { BotDirectory } from "@/components/bot-directory";
import { BOT_INTEGRATIONS, isBotIntegration } from "@/lib/api";
import { loadPublicBots } from "@/lib/public-catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 300;

export function generateStaticParams() {
  return BOT_INTEGRATIONS.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isBotIntegration(slug)) return { title: "Bots | SkaleAgents" };
  const label = BOT_INTEGRATIONS.find((item) => item.slug === slug)?.label ?? slug;
  return {
    title: `${label} security and reliability prompts | SkaleAgents`,
    description: `Free ${label} reviewer prompts. Paste the artifact, then open the prompt in Grok, Claude, or Codex.`,
    alternates: { canonical: `/bot-directory/integrations/${slug}` },
  };
}

export default async function BotIntegrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isBotIntegration(slug)) notFound();
  const initialBots = await loadPublicBots();
  return <BotDirectory initialBots={initialBots} integration={slug} />;
}
