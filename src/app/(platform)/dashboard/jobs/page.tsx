"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch, type SwarmJob, type WatchtowerSession, watchtowerFetch } from "@/lib/api";
import { AdvisoryBookingRequest } from "@/components/advisory-booking-request";
import { Button, LinkButton } from "@/components/ui";
import { currentUserOptions } from "@/lib/session";
import { JobDeletionStatus, JobRetentionControls } from "@/components/job-retention-controls";
import { RetentionNotice } from "@/components/retention-notice";
import { SourceMetadata } from "@/components/source-metadata";

export default function JobsPage() {
  const router = useRouter();
  const user = useQuery(currentUserOptions);
  const accountId = user.data?.id;
  const jobsKey = ["swarm-jobs", accountId ?? "guest"];
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [deletions, setDeletions] = useState<Record<string, "pending" | "processing" | "failed" | "completed">>({});
  const jobs = useQuery({
    queryKey: jobsKey,
    enabled: Boolean(user.data),
    queryFn: async ({ signal }) => (await apiFetch<{ jobs: SwarmJob[] }>("/api/jobs", { signal })).jobs,
    refetchInterval: (query) => query.state.data?.some((job) => job.status === "queued" || job.status === "running" || job.retention?.inputPurgeStatus === "pending" || job.retention?.inputPurgeStatus === "failed") ? 5000 : false,
  });
  const filteredJobs = jobs.data?.filter((job) => status === "all" || job.status === status) ?? [];
  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / 10));
  const currentPage = Math.min(page, pageCount);
  const visibleJobs = filteredJobs.slice((currentPage - 1) * 10, currentPage * 10);
  const openReview = useMutation({
    mutationFn: (jobId: string) => watchtowerFetch<WatchtowerSession>("/sessions", {
      method: "POST",
      body: JSON.stringify({ jobId }),
    }),
    onSuccess: (session) => router.push(`/dashboard/watchtower/${session.id}`),
  });

  return (
    <main className="space-y-8">
      {user.data && <RetentionNotice key={user.data.id} accountId={user.data.id} />}
      <div className="workspace-intro flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="workspace-heading">Audit jobs</h1>
          <p className="mt-2 text-sm text-ink-muted">Track your reviews and open findings in Watchtower.</p>
        </div>
        <LinkButton href="/dashboard/jobs/new">New audit</LinkButton>
      </div>

      <section className="space-y-3">
        {accountId && Object.entries(deletions).map(([jobId, initialStatus]) => <JobDeletionStatus key={jobId} jobId={jobId} initialStatus={initialStatus} accountId={accountId} />)}
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-ink">Your jobs</h2><LinkButton href="/dashboard/schedules" variant="secondary">Set up recurring reviews</LinkButton></div>
        <div className="flex flex-wrap gap-2">{["all", "queued", "running", "completed", "failed"].map((item) => <button key={item} type="button" className="filter-chip capitalize" aria-pressed={status === item} onClick={() => { setStatus(item); setPage(1); }}>{item === "all" ? "All jobs" : item} {jobs.data ? `(${jobs.data.filter((job) => item === "all" || job.status === item).length})` : ""}</button>)}</div>
        {openReview.isError && <p role="alert" className="text-sm text-danger">{openReview.error.message}</p>}
        {(user.isPending || user.data && jobs.isPending) && <p className="text-sm text-ink-muted">Loading jobs…</p>}
        {!user.isPending && !user.data && <p className="text-sm text-ink-muted">Use Sign in in the header to access your audit jobs.</p>}
        {jobs.isError && (
          <div className="rounded-[10px] border border-line p-4">
            <p className="text-sm text-danger">{jobs.error.message}</p>
            <p className="mt-2 text-sm text-ink-muted">Use Sign in in the header to access your audit jobs.</p>
          </div>
        )}
        {jobs.data?.length === 0 && <div className="rounded-xl border border-dashed border-line p-6 text-sm text-ink-muted"><p>No audits yet. Create one to review your infrastructure.</p><LinkButton href="/dashboard/jobs/new" className="mt-4">New audit</LinkButton></div>}
        {Boolean(jobs.data?.length) && !jobs.data?.some((job) => status === "all" || job.status === status) && <p className="text-sm text-ink-muted">No {status} jobs. Choose another status to see your reviews.</p>}
        <ul className="divide-y divide-line">
          {visibleJobs.map((job) => (
            <li key={job.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">{job.status}</p>
                <p className="mt-1 text-sm text-ink">{job.summary ?? "Waiting for specialist results"}</p>
                <p className="mt-1 text-xs text-ink-muted">{job.specialists.join(" · ")}{job.partial ? " · Partial results" : ""}</p>
                {job.error && <p className="mt-1 text-sm text-danger">{job.error}</p>}
                <p className="mt-1 text-xs text-ink-muted">{new Date(job.createdAt).toLocaleString()}</p>
                <SourceMetadata sourceRevision={job.sourceRevision} sourceObservedAt={job.sourceObservedAt} inputAvailable={job.retention?.inputAvailable} />
              </div>
              <div className="flex flex-wrap gap-2">
                {(job.status === "completed" || job.status === "failed") && (
                  <AdvisoryBookingRequest source={{ type: "audit_job", id: job.id }} />
                )}
                <Button type="button" variant="secondary" disabled={openReview.isPending} onClick={() => openReview.mutate(job.id)}>
                  Open Watchtower
                </Button>
              </div>
              {user.data && <JobRetentionControls job={job} accountId={user.data.id} onDeletion={(jobId, state) => setDeletions(current => ({ ...current, [jobId]: state }))} />}
            </li>
          ))}
        </ul>
        {pageCount > 1 && <nav aria-label="Audit jobs pages" className="flex items-center justify-between gap-4 border-t border-line pt-4 text-sm">
          <Button type="button" variant="secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button>
          <span>Page {currentPage} of {pageCount}</span>
          <Button type="button" variant="secondary" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button>
        </nav>}
      </section>
    </main>
  );
}
