import { publicCheckPath, publicChecks } from "@/lib/public-checks";

export const dynamic = "force-static";

export function GET() {
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
