import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import { jsonLd, productJsonLd } from "@/lib/json-ld";
import { notFound } from "next/navigation";
import { BotDetail } from "@/components/bot-detail";
import { loadPublicBot, loadPublicBots } from "@/lib/public-catalog";

const RESERVED_IDS = new Set(["integrations", "specialties", "categories"]);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (RESERVED_IDS.has(id)) return { title: "Bot | SkaleAgents" };
  const bot = await loadPublicBot(id);
  if (!bot) return { title: "Bot | SkaleAgents" };
  return pageMetadata({
    path: `/bot-directory/${bot.id}`,
    title: `${bot.name} | SkaleAgents bot`,
    description: bot.description || "Specialist instructions you can read without an account.",
    pad: "Read this specialist's instructions, then open them in your assistant.",
  });
}

export default async function BotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (RESERVED_IDS.has(id)) notFound();
  const [initialBot, initialBots] = await Promise.all([loadPublicBot(id), loadPublicBots()]);
  const product = initialBot ? productJsonLd({ title: initialBot.name, description: initialBot.description || "Specialist instructions you can read without an account.", path: `/bot-directory/${initialBot.id}` }) : null;
  return <>
    {product ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(product) }} /> : null}
    <BotDetail initialBot={initialBot} initialBots={initialBots} />
  </>;
}
