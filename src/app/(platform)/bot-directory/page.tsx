import { markdownPath } from "@/lib/ai-corpus";
import { BotDirectory } from "@/components/bot-directory";
import { loadPublicBots } from "@/lib/public-catalog";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Bot directory | SkaleAgents",
  description: "Read public specialist instructions for infrastructure review. No account required.",
  alternates: { canonical: "/bot-directory", types: { "text/markdown": markdownPath("/bot-directory") } },
};

export default async function BotsPage() {
  const initialBots = await loadPublicBots();
  return <BotDirectory initialBots={initialBots} />;
}
