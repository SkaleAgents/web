"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, API_URL, type PatchProposal, type ProposalGenerationResult, type SwarmFinding, type SwarmJob, type SwarmStep, type WatchtowerSession, watchtowerFetch } from "@/lib/api";
import { Button, LinkButton } from "@/components/ui";

export default function WatchtowerPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const queryClient = useQueryClient();
  const [steps, setSteps] = useState<SwarmStep[]>([]);
  const close = useMutation({
    mutationFn: () => watchtowerFetch<WatchtowerSession & { proposals?: PatchProposal[] }>(`/sessions/${sessionId}/close`, { method: "POST" }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["watchtower-session", sessionId] }),
  });
  const session = useQuery({
    queryKey: ["watchtower-session", sessionId],
    queryFn: () => watchtowerFetch<WatchtowerSession & { proposals?: PatchProposal[] }>(`/sessions/${sessionId}`),
  });
  const job = useQuery({
    queryKey: ["swarm-job", session.data?.jobId],
    enabled: Boolean(session.data?.jobId),
    queryFn: () => apiFetch<SwarmJob>(`/api/jobs/${session.data!.jobId}`),
  });

  useEffect(() => {
    if (!session.data || session.data.status === "closed") return;
    const events = new EventSource(`${API_URL}/api/watchtower/sessions/${sessionId}/stream`, { withCredentials: true });
    events.addEventListener("step", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { step: SwarmStep };
      setSteps((current) => current.some((step) => step.stepId === payload.step.stepId) ? current : [...current, payload.step]);
    });
    return () => events.close();
  }, [session.data, sessionId]);

  if (session.isPending || job.isPending) return <p className="text-sm text-ink-muted">Loading Watchtower…</p>;
  if (session.isError || job.isError) {
    const error = session.error instanceof Error ? session.error : job.error;
    return <p className="text-sm text-danger">{error instanceof Error ? error.message : "Watchtower unavailable"}</p>;
  }
  const proposals = session.data?.proposals ?? [];
  const content = typeof job.data?.scope.content === "string" ? job.data.scope.content : "";
  const allSteps = [...(job.data?.steps ?? []), ...steps].filter((step, index, all) => all.findIndex((item) => item.stepId === step.stepId) === index);

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-accent">Watchtower review</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Live audit session</h1>
          <p className="mt-1 text-sm text-ink-muted">{job.data?.summary ?? "Specialists are working"}</p>
          <p className="mt-2 text-xs text-ink-muted">Participants: {session.data?.participants.length ?? 0}</p>
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
          <LinkButton href="/jobs" className="bg-transparent">Back to audits</LinkButton>
        </div>
      </div>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-[10px] border border-line bg-canvas-elevated p-5">
          <h2 className="text-lg font-semibold text-ink">Findings</h2>
          <ul className="mt-4 space-y-4">
            {job.data?.findings?.map((finding) => (
              <li key={`${finding.specialist}-${finding.resource}-${finding.title}`} className="border-l-2 border-danger pl-3">
                <p className="font-mono text-xs uppercase tracking-wide text-danger">{finding.severity} · {finding.specialist}</p>
                <p className="mt-1 font-medium text-ink">{finding.title}</p>
                <p className="mt-1 text-sm text-ink-muted">{finding.detail}</p>
                <p className="mt-2 text-xs text-ink-muted">Remediation: {finding.remediation}</p>
              </li>
            ))}
            {job.data?.findings?.length === 0 && <li className="text-sm text-ink-muted">No findings.</li>}
          </ul>
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
        content={content}
        onUpdated={() => void queryClient.invalidateQueries({ queryKey: ["watchtower-session", sessionId] })}
      />
      {close.isError && <p className="text-sm text-danger">{close.error.message}</p>}
    </main>
  );
}

function ProposalList({ proposals, sessionId, findings, content, onUpdated }: { proposals: PatchProposal[]; sessionId: string; findings: SwarmFinding[]; content: string; onUpdated: () => void }) {
  const [diffs, setDiffs] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState<ProposalGenerationResult["skipped"]>([]);
  const generate = useMutation({
    mutationFn: () => watchtowerFetch<ProposalGenerationResult>(`/sessions/${sessionId}/proposals/generate`, {
      method: "POST",
      body: JSON.stringify({ findings, content, file: "audit-input.tf" }),
    }),
    onSuccess: (result) => {
      setSkipped(result.skipped);
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
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" disabled={generate.isPending || !content || findings.length === 0} onClick={() => generate.mutate()}>
          {generate.isPending ? "Analyzing findings…" : "Generate safe proposals"}
        </Button>
        {generate.isError && <p className="text-sm text-danger">{generate.error.message}</p>}
      </div>
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
            {proposal.status === "pending" && (
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
