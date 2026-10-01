import { markdownPath } from "@/lib/ai-corpus";
import { BotDirectory } from "@/components/bot-directory";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bot directory | SkaleAgents",
  description: "Search specialist DevOps bots and open their instructions in your own assistant.",
  alternates: { canonical: "/bots", types: { "text/markdown": markdownPath("/bots") } },
};

export default function BotsPage() {
  return <BotDirectory />;
}
