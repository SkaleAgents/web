import { SPECIALTIES, type Specialty } from "@/lib/api";
import { countBotsBySpecialty, loadPublicBots } from "@/lib/public-catalog";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import Link from "next/link";

export const revalidate = 300;

const SPECIALTY_LABEL: Record<Specialty, string> = {
  devops: "DevOps",
  devsecops: "DevSecOps",
  sre: "SRE",
  mlops: "MLOps",
  scaling: "Scaling",
  general: "General",
};

export const metadata: Metadata = pageMetadata({ path: "/bot-directory/specialties", title: "Bots by specialty | SkaleAgents", description: "Free reviewers grouped by DevOps, DevSecOps, SRE, MLOps, Scaling, and General.", markdown: false });

export default async function BotSpecialtiesPage() {
  const bots = await loadPublicBots();
  const counts = countBotsBySpecialty(bots ?? []);

  return (
    <main className="space-y-8">
      <div className="workspace-intro">
        <p className="workspace-kicker">Explore / Specialties</p>
        <h1 className="workspace-heading">Bots by specialty</h1>
        <p className="mt-1 max-w-xl text-sm text-ink-muted">
          Pick a specialty. Each bot is a free reviewer you can open in Grok, Claude, Codex, or copy into any assistant.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {SPECIALTIES.map((specialty) => (
          <li key={specialty} className="rounded-xl border border-line bg-canvas-elevated p-5">
            <Link href={`/bot-directory/specialties/${specialty}`} className="text-lg font-medium text-ink hover:underline">
              {SPECIALTY_LABEL[specialty]}
            </Link>
            <p className="mt-1 text-sm text-ink-muted">
              {counts[specialty]} published {counts[specialty] === 1 ? "bot" : "bots"}
            </p>
          </li>
        ))}
      </ul>
      <p className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
        <Link href="/bot-directory" className="text-ink underline">All bots</Link>
        <Link href="/bot-directory/integrations" className="text-ink underline">Bots by tool</Link>
      </p>
    </main>
  );
}
