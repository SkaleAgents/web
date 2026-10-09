import { BotDirectory } from "@/components/bot-directory";
import { isSpecialty, SPECIALTIES, SPECIALTY_LABEL } from "@/lib/api";
import { loadPublicBots } from "@/lib/public-catalog";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import { notFound } from "next/navigation";

export const revalidate = 300;

export function generateStaticParams() {
  return SPECIALTIES.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isSpecialty(slug)) return { title: "Bots | SkaleAgents" };
  const label = SPECIALTY_LABEL[slug];
  return pageMetadata({
    path: `/bot-directory/specialties/${slug}`,
    title: `${label} reviewers | SkaleAgents`,
    description: `${label} reviewers you can read, then open in the assistant you already use. Free public instructions for infrastructure review, no account required.`,
    markdown: false,
  });
}

export default async function BotSpecialtyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSpecialty(slug)) notFound();
  const initialBots = await loadPublicBots();
  return <BotDirectory initialBots={initialBots} specialty={slug} />;
}
