import { BotDirectory } from "@/components/bot-directory";
import Link from "next/link";
import { SPECIALTIES, SPECIALTY_LABEL } from "@/lib/api";
import { loadPublicBots } from "@/lib/public-catalog";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({ path: "/bot-directory", title: "Bot directory | SkaleAgents", description: "Read public specialist instructions for infrastructure review, then open them in the assistant you already use. No account required." });

export default async function BotsPage() {
  const initialBots = await loadPublicBots();
  return <>
    <BotDirectory initialBots={initialBots} />
    <nav aria-label="Browse by specialty" className="mt-10">
      <h2 className="text-lg font-semibold">Browse by specialty</h2>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
        {SPECIALTIES.map((specialty) => <li key={specialty}><Link href={`/bot-directory/specialties/${specialty}`} className="underline decoration-line underline-offset-4">{SPECIALTY_LABEL[specialty]}</Link></li>)}
      </ul>
    </nav>
  </>;
}
