"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui";
import { apiFetch, ensureCsrfCookie, ApiError, type SwarmFinding } from "@/lib/api";
import { FIXABLE_TITLES } from "@/lib/review-edits";

// Branch audits only: the API turns away pasted text and pull request reviews, and says why.
export function OpenFixPullRequest({ jobId, finding }: { jobId: string; finding: SwarmFinding }) {
  const open = useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie();
      return apiFetch<{ pullRequestUrl: string }>(`/api/jobs/${jobId}/findings/${finding.fingerprint}/fix-pull-request`, { method: "POST" });
    },
  });
  if (!finding.fingerprint || !FIXABLE_TITLES.includes(finding.title)) return null;
  if (open.data) {
    return <p className="finding-action"><span>Fix</span><a href={open.data.pullRequestUrl} className="font-semibold text-accent underline underline-offset-4" target="_blank" rel="noreferrer">Review the pull request</a>. Nothing is merged for you.</p>;
  }
  const message = open.error instanceof ApiError && open.error.status === 404
    ? "Fix pull requests are only available for audits of a branch in your connected repository."
    : open.error?.message;
  return <div className="finding-decision">
    <Button type="button" variant="secondary" disabled={open.isPending} onClick={() => open.mutate()}>{open.isPending ? "Opening…" : "Open a fix pull request"}</Button>
    {message ? <p role="alert" className="text-sm text-danger">{message}</p> : null}
  </div>;
}
