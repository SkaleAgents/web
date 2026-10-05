"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type KeyboardEvent } from "react";
import { ConsultancyBookingLink } from "@/components/consultancy-booking-link";
import { JobDeletionStatus, JobRetentionControls } from "@/components/job-retention-controls";
import { AuditResultSummary } from "@/components/audit-result-summary";
import { AuditCoveragePanel, PlainCheckList } from "@/components/audit-coverage";
import { findingPlace } from "@/lib/audit-coverage";
import { leadFinding, plainRisk } from "@/lib/audit-risk";
import { SourceMetadata } from "@/components/source-metadata";
import { Button, LinkButton } from "@/components/ui";
import { scheduledRunLabel } from "@/lib/audit-dispatch";
import { apiFetch, type SwarmJob, type WatchtowerSession, watchtowerFetch } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { organizationPath, scopeFromPath } from "@/lib/dashboard-routes";

function RiskLead({ findings, partial }: { findings: Array<{ title: string; severity: string }>; partial?: boolean }) {
  const lead = leadFinding(findings);
  const more = findings.length - 1;
  return <section className="audit-risk" aria-label="Risk">
    <span className="finding-severity" data-severity={lead.severity}>{lead.severity}</span>
    <h2>{plainRisk(lead.title, lead.severity)}</h2>
    {more > 0 && <p>{more} more {more === 1 ? "finding is" : "findings are"} listed below.</p>}
    {partial && <p>Some checks may be missing. This is not the full picture.</p>}
  </section>;
}

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
  const [view, setView] = useState<"general" | "advanced">("general");
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
    const next = view === "general" ? "advanced" : "general";
    setView(next);
    document.getElementById(next === "general" ? "audit-general-tab" : "audit-advanced-tab")?.focus();
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
          <button type="button" role="tab" id="audit-general-tab" aria-controls="audit-general-panel" aria-selected={view === "general"} tabIndex={view === "general" ? 0 : -1} onClick={() => setView("general")}>General</button>
          <button type="button" role="tab" id="audit-advanced-tab" aria-controls="audit-advanced-panel" aria-selected={view === "advanced"} tabIndex={view === "advanced" ? 0 : -1} onClick={() => setView("advanced")}>Advanced</button>
        </div>
        <div role="tabpanel" id="audit-general-panel" aria-labelledby="audit-general-tab" hidden={view !== "general"} className="space-y-6">
          {job.data.findings && job.data.findings.length > 0 ? <RiskLead findings={job.data.findings} partial={job.data.partial} /> : <section className="audit-overview" aria-label="Audit overview">
            <p className="audit-status text-xs font-semibold capitalize text-ink-muted">{job.data.status}{job.data.partial ? " · Partial results" : ""}{scheduledRunLabel(job.data) ? ` · ${scheduledRunLabel(job.data)}` : ""}</p>
            <AuditResultSummary job={job.data} />
            {job.data.summary && <p className="mt-2 text-sm text-ink-muted">{job.data.summary}</p>}
            {job.data.error && <p role="alert" className="mt-3 text-sm text-danger">{job.data.error}</p>}
          </section>}
          {job.data.findings && job.data.findings.length > 0 && job.data.error && <p role="alert" className="text-sm text-danger">{job.data.error}</p>}
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
          <section className="audit-source" aria-label="Source">
            <h2>Source</h2>
            <p>Specialists: {job.data.specialists.join(", ") || "none"}</p>
            <SourceMetadata sourceRevision={job.data.sourceRevision} sourceObservedAt={job.data.sourceObservedAt} inputAvailable={job.data.retention?.inputAvailable} verified={job.data.sourceMetadataProvenance === "github_fetched"} />
          </section>
          {job.data.findings && job.data.findings.some((finding) => findingPlace(finding)) && <section className="audit-source" aria-label="Affected resources">
            <h2>Affected resources</h2>
            <ul className="mt-3 space-y-3">{job.data.findings.map((finding, index) => {
              const place = findingPlace(finding);
              if (!place) return null;
              return <li key={index}>{job.data.findings!.length > 1 && <p className="text-sm font-medium text-ink">{finding.title}</p>}<FindingResource value={place} /></li>;
            })}</ul>
          </section>}
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
