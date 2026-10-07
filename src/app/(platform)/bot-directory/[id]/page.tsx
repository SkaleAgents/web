import type { Metadata } from "next";
import { BotDetail } from "@/components/bot-detail";
import { markdownPath } from "@/lib/ai-corpus";
import { loadPublicBot, loadPublicBots } from "@/lib/public-catalog";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const bot = await loadPublicBot((await params).id);
  if (!bot) return { title: "Bot | SkaleAgents" };
  return {
    title: `${bot.name} | SkaleAgents bot`,
    description: bot.description || "Specialist instructions you can read without an account.",
    alternates: { canonical: `/bot-directory/${bot.id}`, types: { "text/markdown": markdownPath(`/bot-directory/${bot.id}`) } },
  };
}

export default async function BotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [initialBot, initialBots] = await Promise.all([loadPublicBot(id), loadPublicBots()]);
  return <BotDetail initialBot={initialBot} initialBots={initialBots} />;
}
