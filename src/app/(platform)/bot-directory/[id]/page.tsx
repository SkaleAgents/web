import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BotDetail } from "@/components/bot-detail";
import { markdownPath } from "@/lib/ai-corpus";
import { loadPublicBot, loadPublicBots } from "@/lib/public-catalog";

const RESERVED_IDS = new Set(["integrations", "specialties", "categories"]);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (RESERVED_IDS.has(id)) return { title: "Bot | SkaleAgents" };
  const bot = await loadPublicBot(id);
  if (!bot) return { title: "Bot | SkaleAgents" };
  return {
    title: `${bot.name} | SkaleAgents bot`,
    description: bot.description || "Specialist instructions you can read without an account.",
    alternates: { canonical: `/bot-directory/${bot.id}`, types: { "text/markdown": markdownPath(`/bot-directory/${bot.id}`) } },
  };
}

export default async function BotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (RESERVED_IDS.has(id)) notFound();
  const [initialBot, initialBots] = await Promise.all([loadPublicBot(id), loadPublicBots()]);
  return <BotDetail initialBot={initialBot} initialBots={initialBots} />;
}
