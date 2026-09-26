"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch, ensureCsrfCookie, type SwarmJob, type WatchtowerSession, watchtowerFetch } from "@/lib/api";
import { AdvisoryBookingRequest } from "@/components/advisory-booking-request";
import { Button, LinkButton } from "@/components/ui";
import { currentUserOptions } from "@/lib/session";
import { JobDeletionStatus, JobRetentionControls } from "@/components/job-retention-controls";
import { RetentionNotice } from "@/components/retention-notice";
import { SourceMetadata } from "@/components/source-metadata";
import { SourceMetadataFields } from "@/components/source-metadata-fields";
import { buildSourceMetadata } from "@/lib/source-metadata";

const AUDIT_SPECIALISTS = ["devsecops", "sre", "mlops", "scaling"] as const;
const specialistDetails = {
  devsecops: { title: "Security", detail: "Exposed services, broad permissions, and secret handling." },
  sre: { title: "Reliability", detail: "Health checks, failure recovery, and deployment resilience." },
  mlops: { title: "AI workloads", detail: "Model-serving configuration and workload resource concerns." },
  scaling: { title: "Scaling & cost", detail: "Capacity, resource sizing, and scaling configuration." },
};
type AuditSpecialist = (typeof AUDIT_SPECIALISTS)[number];

export default function JobsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useQuery(currentUserOptions);
  const accountId = user.data?.id;
  const jobsKey = ["swarm-jobs", accountId ?? "guest"];
  const [content, setContent] = useState("");
  const [telemetry, setTelemetry] = useState("");
  const [sourceRevision, setSourceRevision] = useState("");
  const [sourceObservedAt, setSourceObservedAt] = useState("");
  const [status, setStatus] = useState("all");
  const [deletions, setDeletions] = useState<Record<string, "pending" | "processing" | "failed" | "completed">>({});
  const [specialists, setSpecialists] = useState<AuditSpecialist[]>(["devsecops", "sre"]);
  const jobs = useQuery({
    queryKey: jobsKey,
    enabled: Boolean(user.data),
    queryFn: async ({ signal }) => (await apiFetch<{ jobs: SwarmJob[] }>("/api/jobs", { signal })).jobs,
    refetchInterval: (query) => query.state.data?.some((job) => job.status === "queued" || job.status === "running" || job.retention?.inputPurgeStatus === "pending" || job.retention?.inputPurgeStatus === "failed") ? 5000 : false,
  });
  const create = useMutation({
    mutationFn: async () => {
      let parsedTelemetry: Record<string, unknown> | undefined;
      if (telemetry.trim()) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(telemetry);
        } catch {
          throw new Error("Telemetry must be valid JSON");
        }
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          throw new Error("Telemetry must be a JSON object");
        }
        parsedTelemetry = parsed as Record<string, unknown>;
      }
      await ensureCsrfCookie();
      return apiFetch<SwarmJob>("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          scope: { kind: "iac_text", format: "auto", content },
          specialists,
          ...buildSourceMetadata(sourceRevision, sourceObservedAt),
          ...(parsedTelemetry ? { telemetry: parsedTelemetry } : {}),
        }),
      });
    },
    onSuccess: () => {
      setContent("");
      setTelemetry("");
      setSourceRevision("");
      setSourceObservedAt("");
      void queryClient.invalidateQueries({ queryKey: jobsKey });
    },
  });
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
      <div className="workspace-intro">
        <p className="workspace-kicker">Review / From configuration to findings</p>
        <h1 className="workspace-heading">Audit jobs</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Paste infrastructure code and choose the perspectives you need. Track the audit here,
          then open Watchtower to inspect the evidence and discuss the findings.
        </p>
      </div>

      <section className="rounded-[10px] border border-line bg-canvas-elevated p-5">
        <h2 className="text-lg font-semibold text-ink">Start an IaC audit</h2>
        <p className="mt-2 text-sm text-ink-muted">Bring Terraform, CloudFormation, or Kubernetes configuration. Include the resources a reviewer needs to understand the scope.</p>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="mt-4 min-h-32 w-full rounded-[10px] border border-line bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent"
          placeholder={'resource "aws_security_group" "web" {}'}
          aria-label="IaC content"
        />
        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="audit-telemetry">Telemetry JSON (optional)</label>
        <textarea
          id="audit-telemetry"
          value={telemetry}
          onChange={(event) => setTelemetry(event.target.value)}
          className="mt-2 min-h-24 w-full rounded-[10px] border border-line bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent"
          placeholder={'{ "retryCount": 4, "logs": ["request timeout"] }'}
          aria-label="Telemetry JSON"
        />
        <SourceMetadataFields
          idPrefix="audit-source"
          revision={sourceRevision}
          observedAt={sourceObservedAt}
          onRevisionChange={setSourceRevision}
          onObservedAtChange={setSourceObservedAt}
        />
        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-ink">Specialists</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {AUDIT_SPECIALISTS.map((specialist) => (
              <label key={specialist} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm ${specialists.includes(specialist) ? "border-accent bg-accent-soft" : "border-line"}`}>
                <input
                  type="checkbox"
                  checked={specialists.includes(specialist)}
                  onChange={(event) => setSpecialists((current) => event.target.checked
                    ? [...current, specialist]
                    : current.filter((item) => item !== specialist))}
                />
                <span><strong className="block text-ink">{specialistDetails[specialist].title}</strong><span className="mt-1 block text-ink-muted">{specialistDetails[specialist].detail}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-3 flex items-center gap-3">
          <Button type="button" disabled={!user.data || !content.trim() || specialists.length === 0 || create.isPending} onClick={() => create.mutate()}>
            {create.isPending ? "Queueing…" : "Queue audit"}
          </Button>
          {create.isError && <p className="text-sm text-danger">{create.error.message}</p>}
        </div>
      </section>

      <section className="space-y-3">
        {accountId && Object.entries(deletions).map(([jobId, initialStatus]) => <JobDeletionStatus key={jobId} jobId={jobId} initialStatus={initialStatus} accountId={accountId} />)}
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-ink">Your jobs</h2><LinkButton href="/dashboard/schedules" variant="secondary">Set up recurring reviews</LinkButton></div>
        <div className="flex flex-wrap gap-2">{["all", "queued", "running", "completed", "failed"].map((item) => <button key={item} type="button" className="filter-chip capitalize" aria-pressed={status === item} onClick={() => setStatus(item)}>{item === "all" ? "All jobs" : item} {jobs.data ? `(${jobs.data.filter((job) => item === "all" || job.status === item).length})` : ""}</button>)}</div>
        {openReview.isError && <p role="alert" className="text-sm text-danger">{openReview.error.message}</p>}
        {(user.isPending || user.data && jobs.isPending) && <p className="text-sm text-ink-muted">Loading jobs…</p>}
        {!user.isPending && !user.data && <p className="text-sm text-ink-muted">Use Sign in in the header to access your audit jobs.</p>}
        {jobs.isError && (
          <div className="rounded-[10px] border border-line p-4">
            <p className="text-sm text-danger">{jobs.error.message}</p>
            <p className="mt-2 text-sm text-ink-muted">Use Sign in in the header to access your audit jobs.</p>
          </div>
        )}
        {jobs.data?.length === 0 && <p className="rounded-xl border border-dashed border-line p-6 text-sm text-ink-muted">Your first review starts above. Paste a configuration, select at least one specialist, and queue the audit.</p>}
        {Boolean(jobs.data?.length) && !jobs.data?.some((job) => status === "all" || job.status === status) && <p className="text-sm text-ink-muted">No {status} jobs. Choose another status to see your reviews.</p>}
        <ul className="divide-y divide-line">
          {jobs.data?.filter((job) => status === "all" || job.status === status).map((job) => (
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
      </section>
    </main>
  );
}
