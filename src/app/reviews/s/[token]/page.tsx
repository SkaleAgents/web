import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SavedReviewView, type SavedReviewBody } from "@/components/saved-review-view";
import { API_URL } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "SkaleAgents review",
};

export default async function SharedReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) notFound();
  const response = await fetch(`${API_URL}/api/mcp/reviews/share/${token}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) notFound();
  const review = (await response.json()) as SavedReviewBody;
  return <SavedReviewView review={review} />;
}
