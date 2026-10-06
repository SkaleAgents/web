"use client";

import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, API_URL, type PatchProposal, type ProposalGenerationResult, type SwarmFinding, type SwarmJob, type SwarmStep, type WatchtowerRedirect, type WatchtowerSession, watchtowerFetch } from "@/lib/api";
import { ClearCheckSummary, SkippedCheckList } from "@/components/audit-coverage";
import { findingPlace } from "@/lib/audit-coverage";
import { Button, LinkButton } from "@/components/ui";
import { ConsultancyBookingLink } from "@/components/consultancy-booking-link";
import { currentUserOptions } from "@/lib/session";
import { personalDestinationFromPath } from "@/lib/dashboard-routes";
import { watchtowerSessionTitle } from "@/lib/watchtower-session";
import { priorityReview } from "@/lib/audit-risk";
import { proposedChangeText, submittedAuditText } from "@/lib/review-edits";

export default function WatchtowerPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  return <SessionReview key={sessionId} sessionId={sessionId} />;
}

function SessionReview({ sessionId }: { sessionId: string }) {
  const pathname = usePathname();
  const jobsPath = personalDestinationFromPath(pathname, "jobs");
  const queryClient = useQueryClient();
  const user = useQuery(currentUserOptions);
  const userId = user.data?.id ?? "guest";
  const [steps, setSteps] = useState<SwarmStep[]>([]);
  const [streamStatus, setStreamStatus] = useState<"connecting" | "live" | "reconnecting" | "disconnected">("connecting");
  const [streamAttempt, setStreamAttempt] = useState(0);
  const [instruction, setInstruction] = useState("");
  const close = useMutation({
    mutationFn: () => watchtowerFetch<WatchtowerSession & { proposals?: PatchProposal[] }>(`/sessions/${sessionId}/close`, { method: "POST" }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["watchtower-session", sessionId, userId] }),
  });
  const redirect = useMutation({
    mutationFn: () => watchtowerFetch<WatchtowerRedirect>(`/sessions/${sessionId}/redirect`, {
      method: "POST",
      body: JSON.stringify({ instruction }),
    }),
    onSuccess: () => {
      setInstruction("");
      void queryClient.invalidateQueries({ queryKey: ["watchtower-session", sessionId, userId] });
    },
  });
  const session = useQuery({
    queryKey: ["watchtower-session", sessionId, userId],
    enabled: !user.isPending,
    queryFn: ({ signal }) => watchtowerFetch<WatchtowerSession & { proposals?: PatchProposal[] }>(`/sessions/${sessionId}`, { signal }),
  });
  const job = useQuery({
    queryKey: ["swarm-job", session.data?.jobId, userId],
    enabled: Boolean(session.data?.jobId),
    queryFn: ({ signal }) => apiFetch<SwarmJob>(`/api/jobs/${session.data!.jobId}`, { signal }),
  });

  const streamJobId = session.data?.jobId;
  const streamOpen = session.data?.status === "open";
  useEffect(() => {
    if (!streamJobId || !streamOpen) return;
    let active = true;
    const events = new EventSource(`${API_URL}/api/watchtower/sessions/${sessionId}/stream`, { withCredentials: true });
    const refresh = () => {
      if (!active) return;
      void queryClient.invalidateQueries({ queryKey: ["watchtower-session", sessionId, userId] });
      void queryClient.invalidateQueries({ queryKey: ["swarm-job", streamJobId, userId] });
    };
    events.onopen = () => {
      if (!active) return;
      setStreamStatus("live");
      refresh();
    };
    events.onerror = () => {
      if (!active) return;
      setStreamStatus(events.readyState === EventSource.CLOSED ? "disconnected" : "reconnecting");
    };
    events.addEventListener("step", (event) => {
      if (!active) return;
      try {
        const payload = JSON.parse((event as MessageEvent).data) as { step: SwarmStep };
        if (!payload.step || typeof payload.step.stepId !== "string" || payload.step.jobId !== streamJobId) throw new Error("Invalid step");
        setSteps((current) => current.some((step) => step.stepId === payload.step.stepId) ? current : [...current, payload.step]);
      } catch {
        events.close();
        setStreamStatus("disconnected");
        refresh();
      }
    });
    events.addEventListener("proposal", refresh);
    events.addEventListener("closed", () => { if (active) { events.close(); setStreamStatus("disconnected"); refresh(); } });
    return () => { active = false; events.close(); };
  }, [queryClient, streamJobId, streamOpen, sessionId, userId, streamAttempt]);

  if (session.isError || job.isError) {
    const error = session.error instanceof Error ? session.error : job.error;
    return (
      <main className="space-y-4">
        <h1 className="workspace-heading">Watchtower unavailable</h1>
        <p role="alert" className="text-sm text-danger">{error instanceof Error ? error.message : "Could not load this review."}</p>
        <div className="flex gap-3">
          <Button type="button" disabled={session.isFetching || job.isFetching} onClick={() => void (session.isError ? session.refetch() : job.refetch())}>Try again</Button>
          <LinkButton href={jobsPath} variant="secondary">Back to audits</LinkButton>
        </div>
      </main>
    );
  }
  if (session.isPending || job.isPending) return <p role="status" className="text-sm text-ink-muted">Loading Watchtower…</p>;
  const proposals = session.data?.proposals ?? [];
  const redirects = session.data?.redirects ?? [];
  const sessionOpen = session.data?.status === "open";
  const findings = job.data?.findings ?? [];
  const content = job.data ? submittedAuditText(job.data) : null;
  const { priority, remaining } = priorityReview(findings);
  const proposalContent = content ?? "";
  const allSteps = [...(job.data?.steps ?? []), ...steps].filter((step, index, all) => all.findIndex((item) => item.stepId === step.stepId) === index);

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-accent">Watchtower review</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">{watchtowerSessionTitle(session.data.status)}</h1>
          <p className="mt-1 text-sm text-ink-muted">{job.data?.summary ?? "Specialists are working"}</p>
          <p className="mt-2 break-all font-mono text-xs text-ink-muted">Job {job.data?.id}</p>
          {job.data?.createdAt && <p className="mt-1 text-xs text-ink-muted">Created {new Date(job.data.createdAt).toLocaleString()}</p>}
          {job.data?.updatedAt && <p className="text-xs text-ink-muted">Updated {new Date(job.data.updatedAt).toLocaleString()}</p>}
          <p className="mt-2 text-xs text-ink-muted">Participants: {session.data?.participants.length ?? 0}</p>
          {session.data?.status === "open" && (
            <div className="mt-2 flex items-center gap-3 text-sm">
              <p role="status" className={streamStatus === "live" ? "text-ink-muted" : "text-warning"}>
                {streamStatus === "live" ? "Live updates connected" : streamStatus === "connecting" ? "Connecting live updates…" : streamStatus === "reconnecting" ? "Reconnecting live updates. Displayed results may be outdated." : "Live updates disconnected. Displayed results may be outdated."}
              </p>
              {(streamStatus === "reconnecting" || streamStatus === "disconnected") && <Button variant="secondary" onClick={() => { setStreamStatus("connecting"); setStreamAttempt(value => value + 1); }}>Reconnect</Button>}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {session.data?.status === "open" && (
            <Button
              type="button"
              variant="secondary"
              disabled={close.isPending || proposals.some((proposal) => proposal.status === "pending")}
              onClick={() => close.mutate()}
            >
              {close.isPending ? "Closing…" : "Close session"}
            </Button>
          )}
          <ConsultancyBookingLink />
          <LinkButton href={jobsPath} className="bg-transparent">Back to audits</LinkButton>
        </div>
      </div>

      {priority.length > 0 && <section className="rounded-[10px] border border-line bg-canvas-elevated p-5" aria-label="Fix these first">
        <h2 className="text-lg font-semibold text-ink">Fix these first</h2>
        <ol className="mt-4 space-y-4">
          {priority.map((finding) => (
            <li key={finding.id ?? `${finding.specialist}-${finding.resource}-${finding.title}`} className="border-l-2 border-danger pl-3">
              <p className="font-mono text-xs uppercase tracking-wide text-danger">{finding.severity} · {finding.specialist}</p>
              <p className="mt-1 font-medium text-ink">{finding.title}</p>
              {findingPlace(finding) && <p className="mt-1 break-all font-mono text-xs text-ink-muted">{findingPlace(finding)}</p>}
              <p className="mt-1 text-sm text-ink-muted">{finding.detail}</p>
              <p className="mt-2 text-sm text-ink-muted">{proposedChangeText(content, finding.title)}</p>
              <p className="mt-2 text-xs text-ink-muted">Remediation: {finding.remediation}</p>
              {finding.inputLocatorAvailable === false && <p className="mt-2 text-xs text-ink-muted">{finding.classification === "builtin-v1" ? "Finding retained without source. Original resource locator removed." : "Unclassified finding text removed with input."}</p>}
            </li>
          ))}
        </ol>
      </section>}

      {(sessionOpen || redirects.length > 0) && <section className="rounded-[10px] border border-line bg-canvas-elevated p-5">
        <h2 className="text-lg font-semibold text-ink">{sessionOpen ? "Redirect the swarm" : "Review instructions"}</h2>
        {sessionOpen && <p className="mt-1 text-sm text-ink-muted">Send a review instruction to the next queued swarm task. It never auto-approves a patch.</p>}
        {sessionOpen && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
            <textarea
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              className="min-h-20 flex-1 rounded border border-line bg-canvas p-2 text-sm text-ink"
              placeholder="Focus on the least-privilege remediation"
              aria-label="Redirect instruction"
            />
            <Button type="button" disabled={redirect.isPending || !instruction.trim()} onClick={() => redirect.mutate()}>
              {redirect.isPending ? "Sending…" : "Send redirect"}
            </Button>
          </div>
        )}
        {redirect.isError && <p className="mt-3 text-sm text-danger">{redirect.error.message}</p>}
        {redirects.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-line pt-3 text-sm text-ink-muted">
            {redirects.map((item) => <li key={item.id}>{item.instruction}</li>)}
          </ul>
        )}
      </section>}

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-[10px] border border-line bg-canvas-elevated p-5">
          <h2 className="text-lg font-semibold text-ink">Findings</h2>
          <ul className="mt-4 space-y-4">
            {remaining.map((finding) => (
              <li key={finding.id ?? `${finding.specialist}-${finding.resource}-${finding.title}`} className="border-l-2 border-danger pl-3">
                <p className="font-mono text-xs uppercase tracking-wide text-danger">{finding.severity} · {finding.specialist}</p>
                <p className="mt-1 font-medium text-ink">{finding.title}</p>
                {findingPlace(finding) && <p className="mt-1 break-all font-mono text-xs text-ink-muted">{findingPlace(finding)}</p>}
                <p className="mt-1 text-sm text-ink-muted">{finding.detail}</p>
                <p className="mt-2 text-xs text-ink-muted">Remediation: {finding.remediation}</p>
                {finding.inputLocatorAvailable === false && <p className="mt-2 text-xs text-ink-muted">{finding.classification === "builtin-v1" ? "Finding retained without source. Original resource locator removed." : "Unclassified finding text removed with input."}</p>}
              </li>
            ))}
            {job.data?.findings?.length === 0 && <li className="space-y-3 text-sm text-ink-muted">
              <p>No findings.</p>
              <ClearCheckSummary coverage={job.data.coverage} tasks={job.data.tasks} />
            </li>}
          </ul>
          <div className="mt-4"><SkippedCheckList coverage={job.data?.coverage} tasks={job.data?.tasks} /></div>
        </div>
        <div className="rounded-[10px] border border-line bg-canvas-elevated p-5">
          <h2 className="text-lg font-semibold text-ink">Live steps</h2>
          <ol className="mt-4 max-h-80 space-y-3 overflow-auto">
            {allSteps.map((step) => (
              <li key={step.stepId} className="border-l border-line pl-3">
                <p className="font-mono text-xs text-accent">{step.agent}</p>
                <p className="text-sm text-ink">{step.message}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <ProposalList
        proposals={proposals}
        sessionId={sessionId}
        findings={job.data?.findings ?? []}
        content={proposalContent}
        canPropose={sessionOpen}
        apiSkipped={session.data?.skipped ?? []}
        onUpdated={() => void queryClient.invalidateQueries({ queryKey: ["watchtower-session", sessionId, userId] })}
      />
      {close.isError && <p className="text-sm text-danger">{close.error.message}</p>}
    </main>
  );
}

function ProposalList({ proposals, sessionId, findings, content, canPropose, apiSkipped, onUpdated }: { proposals: PatchProposal[]; sessionId: string; findings: SwarmFinding[]; content: string; canPropose: boolean; apiSkipped: ProposalGenerationResult["skipped"]; onUpdated: () => void }) {
  const [diffs, setDiffs] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [generatedSkipped, setGeneratedSkipped] = useState<ProposalGenerationResult["skipped"] | null>(null);
  const skipped = generatedSkipped ?? apiSkipped;
  const generate = useMutation({
    mutationFn: () => watchtowerFetch<ProposalGenerationResult>(`/sessions/${sessionId}/proposals/generate`, {
      method: "POST",
      body: JSON.stringify({ findings, content, file: "audit-input.tf" }),
    }),
    onSuccess: (result) => {
      setGeneratedSkipped(result.skipped);
      onUpdated();
    },
  });
  const action = useMutation({
    mutationFn: ({ proposalId, action, body }: { proposalId: string; action: string; body: Record<string, string> }) => watchtowerFetch<PatchProposal>(`/sessions/${sessionId}/proposals/${proposalId}/${action}`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: onUpdated,
  });
  return (
    <section className="rounded-[10px] border border-line bg-canvas-elevated p-5">
      <h2 className="text-lg font-semibold text-ink">Patch proposals</h2>
      {proposals.length === 0 && <p className="mt-3 text-sm text-ink-muted">No patch proposals have been generated for this audit.</p>}
      {canPropose && <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" disabled={generate.isPending || !content || findings.length === 0} onClick={() => generate.mutate()}>
          {generate.isPending ? "Analyzing findings…" : "Generate safe proposals"}
        </Button>
        {generate.isError && <p className="text-sm text-danger">{generate.error.message}</p>}
      </div>}
      {skipped.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm text-ink-muted">
          {skipped.map((item) => <li key={`${item.title}-${item.resource}`}>Skipped {item.title}: {item.reason}</li>)}
        </ul>
      )}
      <div className="mt-4 space-y-5">
        {proposals.map((proposal) => (
          <article key={proposal.id} className="border-t border-line pt-4">
            <p className="font-medium text-ink">{proposal.finding.title}</p>
            <pre className="mt-2 overflow-auto rounded bg-canvas p-3 text-xs text-ink-muted">{proposal.diff}</pre>
            <p className="mt-2 font-mono text-xs uppercase tracking-wide text-ink-muted">{proposal.status}</p>
            {canPropose && proposal.status === "pending" && (
              <div className="mt-3 space-y-2">
                <textarea aria-label={`Replacement diff for ${proposal.finding.title}`} value={diffs[proposal.id] ?? proposal.diff} onChange={(event) => setDiffs({ ...diffs, [proposal.id]: event.target.value })} className="min-h-20 w-full rounded border border-line bg-canvas p-2 font-mono text-xs text-ink" />
                <input aria-label={`Rejection reason for ${proposal.finding.title}`} value={reasons[proposal.id] ?? ""} onChange={(event) => setReasons({ ...reasons, [proposal.id]: event.target.value })} className="w-full rounded border border-line bg-canvas p-2 text-sm text-ink" placeholder="Reason if rejecting" />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" disabled={action.isPending} onClick={() => action.mutate({ proposalId: proposal.id, action: "approve", body: {} })}>Approve</Button>
                  <Button type="button" variant="secondary" disabled={action.isPending || !(diffs[proposal.id] ?? proposal.diff).trim()} onClick={() => action.mutate({ proposalId: proposal.id, action: "modify", body: { diff: diffs[proposal.id] ?? proposal.diff } })}>Modify</Button>
                  <Button type="button" variant="secondary" disabled={action.isPending || !reasons[proposal.id]?.trim()} onClick={() => action.mutate({ proposalId: proposal.id, action: "reject", body: { reason: reasons[proposal.id] } })}>Reject</Button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
