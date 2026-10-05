"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type KeyboardEvent } from "react";
import { ConsultancyBookingLink } from "@/components/consultancy-booking-link";
import { JobDeletionStatus, JobRetentionControls } from "@/components/job-retention-controls";
import { AuditResultSummary } from "@/components/audit-result-summary";
import { AuditCoveragePanel, ClearCheckSummary, PlainCheckList, SkippedCheckList } from "@/components/audit-coverage";
import { findingPlace } from "@/lib/audit-coverage";
import { SourceMetadata } from "@/components/source-metadata";
import { Button, LinkButton } from "@/components/ui";
import { scheduledRunLabel } from "@/lib/audit-dispatch";
import { apiFetch, type SwarmJob, type WatchtowerSession, watchtowerFetch } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { organizationPath, scopeFromPath } from "@/lib/dashboard-routes";

function FindingResource({ value }: { value: string }) {
  const tokens = value.split(/(\.|\[|\])/);
  return <p className="finding-place"><span>Affected resource</span><code>{tokens.map((token, index) => token === "." || token === "[" || token === "]" ? <span key={index}>{token}<wbr /></span> : token)}</code></p>;
}

export function PersonalJobDetail({ id }: { id: string }) {
  const router = useRouter();
  const scope = scopeFromPath(usePathname());
  const root = scope?.kind === "organization" ? organizationPath(scope.id) : "/dashboard";
  const user = useQuery(currentUserOptions);
  const accountId = user.data?.id;
  const [deletion, setDeletion] = useState<"pending" | "processing" | "failed" | "completed" | null>(null);
  const [view, setView] = useState<"simple" | "advanced">("simple");
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
  function onTabsKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = view === "simple" ? "advanced" : "simple";
    setView(next);
    document.getElementById(next === "simple" ? "audit-simple-tab" : "audit-advanced-tab")?.focus();
  }

  return (
    <main className="audit-detail space-y-6">
      <LinkButton href={`${root}/jobs`} variant="ghost">Back to audit jobs</LinkButton>
      <div className="workspace-intro">
        <h1 className="workspace-heading">Audit details</h1>
        <p className="mt-2 text-sm text-ink-muted">Read the results and recommended actions here. You do not need to download a file.</p>
      </div>
      {user.isPending && <p className="text-sm text-ink-muted">Loading account…</p>}
      {!user.isPending && !user.data && <p className="text-sm text-ink-muted">Sign in to view this audit.</p>}
      {user.isError && <p role="alert" className="text-sm text-danger">Could not load your account. Reload to try again.</p>}
      {deletion && accountId && <JobDeletionStatus jobId={id} initialStatus={deletion} accountId={accountId} />}
      {!deletion && accountId && job.isPending && <p className="text-sm text-ink-muted">Loading audit…</p>}
      {!deletion && accountId && job.isError && <p role="alert" className="text-sm text-danger">This audit is unavailable or has been removed.</p>}
      {!deletion && accountId && job.data && <>
        <div className="audit-view-tabs" role="tablist" aria-label="Audit detail" onKeyDown={onTabsKeyDown}>
          <button type="button" role="tab" id="audit-simple-tab" aria-controls="audit-simple-panel" aria-selected={view === "simple"} tabIndex={view === "simple" ? 0 : -1} onClick={() => setView("simple")}>Simple</button>
          <button type="button" role="tab" id="audit-advanced-tab" aria-controls="audit-advanced-panel" aria-selected={view === "advanced"} tabIndex={view === "advanced" ? 0 : -1} onClick={() => setView("advanced")}>Advanced</button>
        </div>
        <div role="tabpanel" id="audit-simple-panel" aria-labelledby="audit-simple-tab" hidden={view !== "simple"} className="space-y-6">
          <section className="audit-overview" aria-label="Audit overview">
            <p className="audit-status text-xs font-semibold capitalize text-ink-muted">{job.data.status}{job.data.partial ? " · Partial results" : ""}{scheduledRunLabel(job.data) ? ` · ${scheduledRunLabel(job.data)}` : ""}</p>
            <AuditResultSummary job={job.data} />
            {job.data.summary && <p className="mt-2 text-sm text-ink-muted">{job.data.summary}</p>}
            {job.data.error && <p role="alert" className="mt-3 text-sm text-danger">{job.data.error}</p>}
          </section>
          {job.data.findings && <section className="audit-findings" aria-label="Findings">
            <div className="audit-section-heading"><h2>Findings</h2><span>{job.data.findings.length} {job.data.findings.length === 1 ? "finding" : "findings"}</span></div>
            {job.data.findings.length === 0 ? <p className="text-sm text-ink-muted">No findings were recorded.</p> : job.data.findings.map((finding, index) => <article key={index} className="audit-finding">
              <span className="finding-severity" data-severity={finding.severity}>{finding.severity}</span>
              <div>
                <h3>{finding.title}</h3>
                <p className="finding-detail">{finding.detail}</p>
                <p className="finding-action"><span>Recommended action</span>{finding.remediation || "No specific fix was recorded. Ask the person responsible for this resource to review the issue before changing it."}</p>
              </div>
            </article>)}
          </section>}
          <PlainCheckList coverage={job.data.coverage} tasks={job.data.tasks} status={job.data.status} />
        </div>
        <div role="tabpanel" id="audit-advanced-panel" aria-labelledby="audit-advanced-tab" hidden={view !== "advanced"} className="space-y-6">
          <section className="audit-overview" aria-label="Audit record">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="break-all font-mono text-xs text-ink-muted">Job {job.data.id}</p>
                <p className="mt-2 text-sm text-ink-muted">Created {new Date(job.data.createdAt).toLocaleString()}</p>
                <p className="text-sm text-ink-muted">Updated {new Date(job.data.updatedAt).toLocaleString()}</p>
              </div>
              <Button type="button" variant="secondary" disabled={openReview.isPending} onClick={() => openReview.mutate()}>Open Watchtower</Button>
            </div>
            {openReview.isError && <p role="alert" className="text-sm text-danger">{openReview.error.message}</p>}
          </section>
          <section className="audit-source" aria-label="Source and coverage">
            <h2>Source and coverage</h2>
            <p>Specialists: {job.data.specialists.join(", ") || "none"}</p>
            <SourceMetadata sourceRevision={job.data.sourceRevision} sourceObservedAt={job.data.sourceObservedAt} inputAvailable={job.data.retention?.inputAvailable} verified={job.data.sourceMetadataProvenance === "github_fetched"} />
          </section>
          {job.data.findings && job.data.findings.length > 0 && <section className="audit-source" aria-label="Affected resources">
            <h2>Affected resources</h2>
            <ul className="mt-3 space-y-3">{job.data.findings.map((finding, index) => {
              const place = findingPlace(finding);
              return <li key={index}><p className="text-sm font-medium text-ink">{finding.title}</p>{place ? <FindingResource value={place} /> : <p className="text-sm text-ink-muted">No resource was recorded.</p>}</li>;
            })}</ul>
          </section>}
          {job.data.findings?.length === 0 && <ClearCheckSummary coverage={job.data.coverage} tasks={job.data.tasks} />}
          <SkippedCheckList coverage={job.data.coverage} tasks={job.data.tasks} />
          <AuditCoveragePanel key={job.data.id} coverage={job.data.coverage} tasks={job.data.tasks} status={job.data.status} />
          <section aria-label="Audit data and report">
            <h2 className="text-lg font-semibold text-ink">Download and data controls</h2>
            <div className="mt-3"><JobRetentionControls job={job.data} accountId={accountId} onDeletion={(_, state) => setDeletion(state)} /></div>
          </section>
          {(job.data.status === "completed" || job.data.status === "failed") && <section className="space-y-3" aria-label="Expert help">
            <h2 className="text-lg font-semibold text-ink">Expert help</h2>
            <ConsultancyBookingLink />
          </section>}
        </div>
      </>}
    </main>
  );
}
