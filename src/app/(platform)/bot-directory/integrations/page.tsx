import { ToolLogo } from "@/components/tool-logo";
import { BOT_INTEGRATIONS } from "@/lib/api";
import { countBotsByIntegration, loadPublicBots } from "@/lib/public-catalog";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Bots by tool | SkaleAgents",
  description: "Free DevOps and security reviewers grouped by GitHub, Slack, Linear, Terraform, AWS, and Kubernetes.",
  alternates: { canonical: "/bot-directory/integrations" },
};

export default async function BotIntegrationsPage() {
  const bots = await loadPublicBots();
  const counts = countBotsByIntegration(bots ?? []);

  return (
    <main className="space-y-8">
      <div className="workspace-intro">
        <p className="workspace-kicker">Explore / Tools you already use</p>
        <h1 className="workspace-heading">Bots by tool</h1>
        <p className="mt-1 max-w-xl text-sm text-ink-muted">
          Pick a tool you already use. Each bot is a free reviewer you can open in Grok, Claude, Codex, or copy into any assistant.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {BOT_INTEGRATIONS.map((item) => (
          <li key={item.slug} className="rounded-xl border border-line bg-canvas-elevated p-5">
            <Link href={`/bot-directory/integrations/${item.slug}`} className="inline-flex items-center gap-2 text-lg font-medium text-ink hover:underline">
              <ToolLogo slug={item.slug} />
              <span>{item.label}</span>
            </Link>
            <p className="mt-1 text-sm text-ink-muted">
              {counts[item.slug]} published {counts[item.slug] === 1 ? "bot" : "bots"}
            </p>
          </li>
        ))}
      </ul>
      <p className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
        <Link href="/bot-directory" className="text-ink underline">All bots</Link>
        <Link href="/bot-directory/specialties" className="text-ink underline">Bots by specialty</Link>
      </p>
    </main>
  );
}
