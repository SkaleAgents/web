"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { useState } from "react";
import { SavedReviewView, type SavedReviewBody } from "@/components/saved-review-view";
import { useOrganizationScope } from "@/components/organization-scope";
import { ApiError, apiFetch } from "@/lib/api";
import { Button } from "@/components/ui";

type OwnerReview = SavedReviewBody & { id: string };

export function SavedReviewDetail({ id }: { id: string }) {
  const { organization } = useOrganizationScope();
  const queryClient = useQueryClient();
  const [shareOff, setShareOff] = useState(false);
  const review = useQuery({
    queryKey: ["saved-review", id],
    queryFn: () => apiFetch<OwnerReview>(`/api/mcp/reviews/${id}`),
    retry: false,
  });
  const revoke = useMutation({
    mutationFn: () => apiFetch<void>(`/api/mcp/reviews/${id}/revoke-share`, { method: "POST" }),
    onSuccess: async () => {
      setShareOff(true);
      await queryClient.invalidateQueries({ queryKey: ["saved-review", id] });
    },
  });

  if (organization.kind !== "personal") notFound();
  if (review.error instanceof ApiError && review.error.status === 404) notFound();
  if (review.isError) return <main className="px-6 py-10">The review could not be loaded.</main>;

  return (
    <div>
      {review.data ? <SavedReviewView review={review.data} /> : <main className="px-6 py-10">Loading the review.</main>}
      {review.data ? (
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-6 pb-10">
          {shareOff ? <p>The share link is off.</p> : null}
          <Button type="button" variant="secondary" disabled={shareOff || revoke.isPending} onClick={() => revoke.mutate()}>
            Turn off the share link
          </Button>
        </div>
      ) : null}
    </div>
  );
}
