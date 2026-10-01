import { loadCommunityPrompts, loadPublicBots } from "@/lib/public-catalog";
import { publicCheckPath, publicChecks } from "@/lib/public-checks";

export const revalidate = 3600;

export async function GET() {
  const [bots, prompts] = await Promise.all([loadPublicBots(), loadCommunityPrompts()]);
  const lines = [
    "# SkaleAgents",
    "",
    "> Public infrastructure review reference. No account and no payment required to read it.",
    "",
    "SkaleAgents publishes the built-in review checks, a bot directory, and a prompt library. Reading them does not run an audit and does not connect to a cloud account.",
    "",
    "## Review checks",
    "- [Review checks](https://skaleagents.com/checks): what each check looks for, the input it needs, and what a result does not prove.",
    ...publicChecks.map((check) => `- [${check.title}](https://skaleagents.com${publicCheckPath(check)}): ${check.looksFor}`),
    "",
    "## Machine-readable catalog",
    "- [JSON catalog](https://skaleagents.com/checks.json)",
    "",
    "## Bot directory",
    "Each page includes the specialist instructions. No account is required.",
    ...(bots ?? []).flatMap((bot) => [
      "",
      `### ${bot.name}`,
      bot.description,
      `https://skaleagents.com/bots/${bot.id}`,
      "",
      bot.promptBody,
    ]),
    "",
    "## Prompt library",
    "Community prompts are free to read and copy.",
    ...(prompts ?? []).flatMap((prompt) => [
      "",
      `### ${prompt.title}`,
      prompt.tags.length ? `Tags: ${prompt.tags.join(", ")}` : "",
      prompt.body,
    ].filter(Boolean)),
    "",
    "## Also public",
    "- [Bot directory](https://skaleagents.com/bots)",
    "- [Prompt library](https://skaleagents.com/prompts)",
    "- [MCP config](https://skaleagents.com/mcp-config)",
    "- [Pricing](https://skaleagents.com/pricing)",
    "",
    "Account pages under /dashboard, /me, /org, /login, and /auth are private. Do not treat them as public reference.",
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
