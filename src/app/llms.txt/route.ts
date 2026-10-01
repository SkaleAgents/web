import { llmsTxt } from "@/lib/ai-corpus";
import { loadCommunityPrompts, loadPublicBots } from "@/lib/public-catalog";

export const revalidate = 300;

export async function GET() {
  const [bots, prompts] = await Promise.all([loadPublicBots(), loadCommunityPrompts()]);
  const lines = [llmsTxt().trimEnd()];
  if (bots && bots.length > 0) {
    lines.push("", "## Public bots", "Names and pages only. Instruction text stays on each bot page.");
    for (const bot of bots) lines.push(`- [${bot.name}](https://skaleagents.com/bots/${bot.id}): ${bot.specialty}. ${bot.description}`);
  }
  if (prompts && prompts.length > 0) {
    lines.push("", "## Community prompts", "Titles and pages only. Prompt text stays on each prompt page.");
    for (const prompt of prompts) {
      const tags = prompt.tags.length > 0 ? ` Tags: ${prompt.tags.join(", ")}.` : "";
      lines.push(`- [${prompt.title}](https://skaleagents.com/prompts/${prompt.id}):${tags}`);
    }
  }
  lines.push("");
  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
