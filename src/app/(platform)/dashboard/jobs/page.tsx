"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { scheduledRunLabel } from "@/lib/audit-dispatch";
import { apiFetch, type SwarmJob } from "@/lib/api";
import { Button, LinkButton } from "@/components/ui";
import { currentUserOptions } from "@/lib/session";
import { AuditHistoryResult } from "@/components/audit-history-result";
import { RetentionNotice } from "@/components/retention-notice";
import { personalDestinationFromPath } from "@/lib/dashboard-routes";

export default function JobsPage() {
  const pathname = usePathname();
  const href = (section: string) => personalDestinationFromPath(pathname, section);
  const user = useQuery(currentUserOptions);
  const accountId = user.data?.id;
  const jobsKey = ["swarm-jobs", accountId ?? "guest"];
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const jobs = useQuery({
    queryKey: jobsKey,
    enabled: Boolean(user.data),
    queryFn: async ({ signal }) => (await apiFetch<{ jobs: SwarmJob[] }>("/api/jobs", { signal })).jobs,
    refetchInterval: (query) => query.state.data?.some((job) => job.status === "queued" || job.status === "running" || job.retention?.inputPurgeStatus === "pending" || job.retention?.inputPurgeStatus === "failed") ? 5000 : false,
  });
  const matchesFilter = (job: SwarmJob, filter: string) => filter === "all" || (filter === "issues" ? (job.findingSummary?.total ?? 0) > 0 : job.status === filter);
  const filteredJobs = jobs.data?.filter((job) => matchesFilter(job, status)) ?? [];
  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / 10));
  const currentPage = Math.min(page, pageCount);
  const visibleJobs = filteredJobs.slice((currentPage - 1) * 10, currentPage * 10);
  return (
    <main className="space-y-8">
      {user.data && <RetentionNotice key={user.data.id} accountId={user.data.id} showRecorded={false} />}
      <div className="workspace-intro flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="workspace-heading">Audit jobs</h1>
          <p className="mt-2 text-sm text-ink-muted">See which audits need attention, then open a report for findings and coverage.</p>
        </div>
        <LinkButton href={href("jobs/new")}>New audit</LinkButton>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-ink">Your jobs</h2><LinkButton href={href("schedules")} variant="secondary">Set up recurring reviews</LinkButton></div>
        <div className="flex flex-wrap gap-2">{["all", "issues", "queued", "running", "completed", "failed"].map((item) => <button key={item} type="button" className="filter-chip capitalize" aria-pressed={status === item} onClick={() => { setStatus(item); setPage(1); }}>{item === "all" ? "All jobs" : item === "issues" ? "Issues found" : item} {jobs.data ? `(${jobs.data.filter((job) => matchesFilter(job, item)).length})` : ""}</button>)}</div>
        {(user.isPending || user.data && jobs.isPending) && <p className="text-sm text-ink-muted">Loading jobs…</p>}
        {!user.isPending && !user.data && <p className="text-sm text-ink-muted">Use Sign in in the header to access your audit jobs.</p>}
        {user.data && jobs.isError && (
          <div className="rounded-[10px] border border-line p-4" role="alert">
            <p className="text-sm text-danger">{jobs.error.message}</p>
            <p className="mt-2 text-sm text-ink-muted">Could not load audit jobs. Try again.</p>
            <Button type="button" variant="secondary" className="mt-3" onClick={() => void jobs.refetch()}>Try again</Button>
          </div>
        )}
        {jobs.data?.length === 0 && <div className="rounded-xl border border-dashed border-line p-6 text-sm text-ink-muted"><p>No audits yet. Create one to review your infrastructure.</p><LinkButton href={href("jobs/new")} className="mt-4">New audit</LinkButton></div>}
        {Boolean(jobs.data?.length) && filteredJobs.length === 0 && <p className="text-sm text-ink-muted">{status === "issues" ? "No audits with recorded findings. Audits with unavailable results may still need review." : `No ${status} jobs. Choose another status to see your reviews.`}</p>}
        <ul className="divide-y divide-line">
          {visibleJobs.map((job) => (
            <li key={job.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold capitalize text-ink-muted">{job.status}{job.partial ? " · Partial results" : ""}{scheduledRunLabel(job) ? ` · ${scheduledRunLabel(job)}` : ""}</p>
                <AuditHistoryResult job={job} />
                {job.summary && <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{job.summary}</p>}
                {job.sourceRevision && <p className="mt-1 break-all text-xs text-ink-muted">Source revision: {job.sourceRevision}</p>}
                <p className="mt-1 text-xs text-ink-muted">{job.specialists.join(" · ")} · {new Date(job.createdAt).toLocaleString()}</p>
              </div>
              <LinkButton href={href(`jobs/${job.id}`)} variant="secondary">View audit</LinkButton>
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
