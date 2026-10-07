import { SavedReviewDetail } from "@/components/saved-review-detail";

export default async function SavedReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SavedReviewDetail id={id} />;
}
