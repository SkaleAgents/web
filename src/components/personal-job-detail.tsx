"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdvisoryBookingRequest } from "@/components/advisory-booking-request";
import { JobDeletionStatus, JobRetentionControls } from "@/components/job-retention-controls";
import { SourceMetadata } from "@/components/source-metadata";
import { Button, LinkButton } from "@/components/ui";
import { apiFetch, type SwarmJob, type WatchtowerSession, watchtowerFetch } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { organizationPath, scopeFromPath } from "@/lib/dashboard-routes";

export function PersonalJobDetail({ id }: { id: string }) {
  const router = useRouter();
  const scope = scopeFromPath(usePathname());
  const root = scope?.kind === "organization" ? organizationPath(scope.id) : "/dashboard";
  const user = useQuery(currentUserOptions);
  const accountId = user.data?.id;
  const [deletion, setDeletion] = useState<"pending" | "processing" | "failed" | "completed" | null>(null);
  const job = useQuery({
    queryKey: ["swarm-job", id, accountId ?? "guest"],
    enabled: Boolean(accountId) && !deletion,
    queryFn: ({ signal }) => apiFetch<SwarmJob>(`/api/jobs/${id}`, { signal }),
    refetchInterval: (query) => query.state.data?.status === "queued" || query.state.data?.status === "running" || query.state.data?.retention?.inputPurgeStatus === "pending" ? 5000 : false,
  });
  const openReview = useMutation({
    mutationFn: () => watchtowerFetch<WatchtowerSession>("/sessions", {
      method: "POST",
      body: JSON.stringify({ jobId: id }),
    }),
    onSuccess: (session) => router.push(`${root}/watchtower/${session.id}`),
  });

  return (
    <main className="space-y-6">
      <LinkButton href={`${root}/jobs`} variant="ghost">Back to audit jobs</LinkButton>
      <div className="workspace-intro">
        <h1 className="workspace-heading">Audit details</h1>
        <p className="mt-2 text-sm text-ink-muted">Review this audit and manage its retained data.</p>
      </div>
      {user.isPending && <p className="text-sm text-ink-muted">Loading account…</p>}
      {!user.isPending && !user.data && <p className="text-sm text-ink-muted">Sign in to view this audit.</p>}
      {user.isError && <p role="alert" className="text-sm text-danger">Could not load your account. Reload to try again.</p>}
      {deletion && accountId && <JobDeletionStatus jobId={id} initialStatus={deletion} accountId={accountId} />}
      {!deletion && accountId && job.isPending && <p className="text-sm text-ink-muted">Loading audit…</p>}
      {!deletion && accountId && job.isError && <p role="alert" className="text-sm text-danger">This audit is unavailable or has been removed.</p>}
      {!deletion && accountId && job.data && <>
        <section className="space-y-4 rounded-[10px] border border-line bg-canvas-elevated p-5" aria-label="Audit overview">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold capitalize text-ink-muted">{job.data.status}{job.data.partial ? " · Partial results" : ""}</p>
              <h2 className="mt-2 text-xl font-semibold text-ink">{job.data.summary ?? "Waiting for specialist results"}</h2>
              <p className="mt-2 text-sm text-ink-muted">Started {new Date(job.data.createdAt).toLocaleString()}</p>
            </div>
            <Button type="button" variant="secondary" disabled={openReview.isPending} onClick={() => openReview.mutate()}>Open Watchtower</Button>
          </div>
          {openReview.isError && <p role="alert" className="text-sm text-danger">{openReview.error.message}</p>}
          {job.data.error && <p role="alert" className="text-sm text-danger">{job.data.error}</p>}
          <div>
            <h3 className="text-sm font-semibold text-ink">Source and coverage</h3>
            <p className="mt-1 text-sm text-ink-muted">Specialists: {job.data.specialists.join(", ") || "none"}</p>
            <SourceMetadata sourceRevision={job.data.sourceRevision} sourceObservedAt={job.data.sourceObservedAt} inputAvailable={job.data.retention?.inputAvailable} />
          </div>
        </section>
        <section className="rounded-[10px] border border-line bg-canvas-elevated p-5" aria-label="Audit data and report">
          <h2 className="text-lg font-semibold text-ink">Audit data and report</h2>
          <div className="mt-3"><JobRetentionControls job={job.data} accountId={accountId} onDeletion={(_, state) => setDeletion(state)} /></div>
        </section>
        {(job.data.status === "completed" || job.data.status === "failed") && <section className="space-y-3 rounded-[10px] border border-line bg-canvas-elevated p-5" aria-label="Expert help">
          <h2 className="text-lg font-semibold text-ink">Expert help</h2>
          <AdvisoryBookingRequest source={{ type: "audit_job", id }} />
        </section>}
      </>}
    </main>
  );
}
