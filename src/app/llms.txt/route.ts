import { llmsTxt, markdownInline } from "@/lib/ai-corpus";
import { loadCommunityPrompts, loadPublicBots } from "@/lib/public-catalog";

export const revalidate = 300;

export async function GET() {
  const [bots, prompts] = await Promise.all([loadPublicBots(), loadCommunityPrompts()]);
  const lines = [llmsTxt().trimEnd()];
  if (bots && bots.length > 0) {
    lines.push("", "## Public bots", "Names and pages only. Instruction text stays on each bot page.");
    for (const bot of bots) lines.push(`- [${markdownInline(bot.name)}](https://skaleagents.com/bot-directory/${bot.id}.md): ${markdownInline(bot.specialty, 80)}. ${markdownInline(bot.description, 200)}`);
  }
  if (prompts && prompts.length > 0) {
    lines.push("", "## Community prompts", "Titles and pages only. Prompt text stays on each prompt page.");
    for (const prompt of prompts) {
      const tags = prompt.tags.length > 0 ? ` Tags: ${markdownInline(prompt.tags.join(", "), 200)}.` : "";
      lines.push(`- [${markdownInline(prompt.title)}](https://skaleagents.com/prompts/${prompt.id}.md):${tags}`);
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
