import type { Metadata } from "next";
import { BotDirectory } from "@/components/bot-directory";
import { loadPublicBots } from "@/lib/public-catalog";

export const metadata: Metadata = {
  title: "Bot directory | SkaleAgents",
  description: "Read public specialist instructions for infrastructure review. No account required.",
  alternates: { canonical: "/bots" },
};

export default async function BotsPage() {
  const initialBots = await loadPublicBots();
  return <BotDirectory initialBots={initialBots} />;
}
