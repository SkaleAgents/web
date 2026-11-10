"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { ConsultancyBookingLink } from "@/components/consultancy-booking-link";
import { JobDeletionStatus, JobRetentionControls } from "@/components/job-retention-controls";
import { AuditResultSummary } from "@/components/audit-result-summary";
import { AuditCoveragePanel, PlainCheckList } from "@/components/audit-coverage";
import { findingPlace } from "@/lib/audit-coverage";
import { leadFinding, plainRisk, priorityReview } from "@/lib/audit-risk";
import { ExactLineChange } from "@/components/exact-line-change";
import { proposedChangeText, reviewCopyText, submittedAuditText } from "@/lib/review-edits";
import { SourceMetadata } from "@/components/source-metadata";
import { SourceFiles } from "@/components/source-files";
import { Button, LinkButton } from "@/components/ui";
import { scheduledRunLabel } from "@/lib/audit-dispatch";
import { apiFetch, type AuditComparison, type SwarmFinding, type SwarmJob, type WatchtowerSession, watchtowerFetch } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { organizationPath, scopeFromPath } from "@/lib/dashboard-routes";
import { formatDateTime } from "@/lib/format-date";
import { DismissedFindings, DismissFinding } from "@/components/finding-decision";
import { OpenFixPullRequest } from "@/components/fix-pull-request";
import { SourceContextForm } from "@/components/source-context";

function AuditChanges({ comparison, href }: { comparison: AuditComparison; href: string }) {
  return <section className="audit-changes" aria-label="Since the last audit">
    <p><strong>Since the <Link href={href}>last audit</Link>:</strong> {comparison.new} new, {comparison.stillOpen} still open, {comparison.fixed.length} fixed</p>
    {comparison.fixed.length > 0 && <ul>{comparison.fixed.map((finding) => <li key={`${finding.title}-${finding.resource}`}>Fixed: {finding.title}</li>)}</ul>}
  </section>;
}

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

function NewBadge({ finding }: { finding: SwarmFinding }) {
  return finding.change === "new" ? <span className="finding-new">New</span> : null;
}

function PriorityReasons({ finding }: { finding: SwarmFinding }) {
  return finding.priorityReasons?.length ? <p className="text-xs text-ink-muted">{finding.priorityReasons.join(". ")}</p> : null;
}

function FixTheseFirst({ findings, content, decide }: { findings: SwarmFinding[]; content: string | null; decide: (finding: SwarmFinding) => ReactNode }) {
  const { priority } = priorityReview(findings);
  if (priority.length === 0) return null;
  return <section className="audit-findings" aria-label="Fix these first">
    <div className="audit-section-heading"><h2>Fix these first</h2></div>
    {priority.map((finding, index) => <article key={`${finding.severity}-${finding.title}-${index}`} className="audit-finding">
      <span className="finding-severity" data-severity={finding.severity}>{finding.severity}</span>
      <div>
        <h3>{finding.title}<NewBadge finding={finding} /></h3>
        <PriorityReasons finding={finding} />
        <p className="finding-detail">{finding.detail}</p>
        <p className="finding-action"><span>Proposed change</span>{proposedChangeText(content, finding.title)}</p>
        <ExactLineChange content={content} title={finding.title} />
        <p className="finding-action"><span>Recommended action</span>{finding.remediation || "No specific fix was recorded. Ask the person responsible for this resource to review the issue before changing it."}</p>
        {decide(finding)}
      </div>
    </article>)}
  </section>;
}

function CopyReviewButton({ findings, content }: { findings: Array<{ title: string; severity: string; remediation?: string }>; content: string | null }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const text = reviewCopyText(findings, content);
  async function copyReview() {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }
  return <div>
    <Button type="button" variant="secondary" onClick={() => void copyReview()}>Copy findings</Button>
    <p className="mt-2 max-w-xl text-sm text-ink-muted" aria-live="polite">{copyState === "copied" ? "Findings copied. Paste them into a chat, a note, or a pull request." : copyState === "failed" ? "Clipboard unavailable. Select and copy the findings below." : "Copies this review as plain text. Paste it into a chat, a note, or a pull request."}</p>
    {copyState === "failed" && <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-ink-muted">{text}</pre>}
  </div>;
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
  const loadedJob = !deletion && accountId ? job.data : undefined;
  const findings = loadedJob?.findings?.filter((finding) => !finding.decision);
  const dismissed = loadedJob?.findings?.filter((finding) => finding.decision) ?? [];
  const jobQueryKey = ["swarm-job", id, accountId ?? "guest"];
  const fromBranch = loadedJob?.fixPullRequest === true && Boolean(loadedJob.sourceFiles?.length) && loadedJob.status === "completed";
  const decide = (finding: SwarmFinding) => <div key={finding.fingerprint}>
    {fromBranch ? <OpenFixPullRequest jobId={id} finding={finding} /> : null}
    <DismissFinding jobId={id} finding={finding} queryKey={jobQueryKey} />
  </div>;
  const ranked = findings ? priorityReview(findings) : null;
  const content = loadedJob ? submittedAuditText(loadedJob) : null;

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
          {findings && findings.length > 0 ? <RiskLead findings={findings} partial={job.data.partial} /> : <section className="audit-overview" aria-label="Audit overview">
            <p className="audit-status text-xs font-semibold capitalize text-ink-muted">{job.data.status}{job.data.partial ? " · Partial results" : ""}{scheduledRunLabel(job.data) ? ` · ${scheduledRunLabel(job.data)}` : ""}</p>
            <AuditResultSummary job={job.data} dismissed={dismissed.length} />
            {job.data.summary && <p className="mt-2 text-sm text-ink-muted">{job.data.summary}</p>}
            {job.data.error && <p role="alert" className="mt-3 text-sm text-danger">{job.data.error}</p>}
          </section>}
          {job.data.comparison && <AuditChanges comparison={job.data.comparison} href={`${root}/jobs/${job.data.comparison.previousJobId}`} />}
          {loadedJob && loadedJob.sourceContext !== undefined && <SourceContextForm key={JSON.stringify(loadedJob.sourceContext)} jobId={id} context={loadedJob.sourceContext} queryKey={jobQueryKey} />}
          {findings && findings.length > 0 && ranked && <FixTheseFirst findings={findings} content={content} decide={decide} />}
          {findings && <CopyReviewButton findings={findings} content={content} />}
          {findings && findings.length > 0 && job.data.error && <p role="alert" className="text-sm text-danger">{job.data.error}</p>}
          {findings && ranked && (findings.length === 0 || ranked.remaining.length > 0) && <section className="audit-findings" aria-label="Findings">
            <div className="audit-section-heading"><h2>{ranked.remaining.length < findings.length ? "Other findings" : "Findings"}</h2><span>{(findings.length === 0 ? findings : ranked.remaining).length} {(findings.length === 0 ? findings : ranked.remaining).length === 1 ? "finding" : "findings"}</span></div>
            {findings.length === 0 ? <p className="text-sm text-ink-muted">{dismissed.length > 0 ? "Every finding in this audit is dismissed." : "No findings were recorded."}</p> : ranked.remaining.map((finding, index) => <article key={index} className="audit-finding">
              <span className="finding-severity" data-severity={finding.severity}>{finding.severity}</span>
              <div>
                <h3>{finding.title}<NewBadge finding={finding} /></h3>
        <PriorityReasons finding={finding} />
                <p className="finding-detail">{finding.detail}</p>
                <p className="finding-action"><span>Recommended action</span>{finding.remediation || "No specific fix was recorded. Ask the person responsible for this resource to review the issue before changing it."}</p>
                {decide(finding)}
              </div>
            </article>)}
          </section>}
          {loadedJob && <DismissedFindings jobId={id} findings={dismissed} queryKey={jobQueryKey} />}
          <PlainCheckList coverage={job.data.coverage} tasks={job.data.tasks} status={job.data.status} />
          {job.data.sourceFiles && job.data.sourceFiles.length > 0 && <SourceFiles files={job.data.sourceFiles} />}
        </div>
        <div role="tabpanel" id="audit-advanced-panel" aria-labelledby="audit-advanced-tab" hidden={view !== "advanced"} className="space-y-6">
          <section className="audit-overview" aria-label="Audit record">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="break-all font-mono text-xs text-ink-muted">Job {job.data.id}</p>
                <p className="mt-2 text-sm text-ink-muted">Created {formatDateTime(job.data.createdAt)}</p>
                <p className="text-sm text-ink-muted">Updated {formatDateTime(job.data.updatedAt)}</p>
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
