import { BotDirectory } from "@/components/bot-directory";
import { isSpecialty, SPECIALTIES, type Specialty } from "@/lib/api";
import { loadPublicBots } from "@/lib/public-catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 300;

const SPECIALTY_LABEL: Record<Specialty, string> = {
  devops: "DevOps",
  devsecops: "DevSecOps",
  sre: "SRE",
  mlops: "MLOps",
  scaling: "Scaling",
  general: "General",
};

export function generateStaticParams() {
  return SPECIALTIES.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isSpecialty(slug)) return { title: "Bots | SkaleAgents" };
  const label = SPECIALTY_LABEL[slug];
  return {
    title: `${label} reviewers | SkaleAgents`,
    description: `${label} reviewers you can read, then open in the assistant you already use.`,
    alternates: { canonical: `/bot-directory/specialties/${slug}` },
  };
}

export default async function BotSpecialtyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSpecialty(slug)) notFound();
  const initialBots = await loadPublicBots();
  return <BotDirectory initialBots={initialBots} specialty={slug} />;
}
