"use client";

import { useState } from "react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { Button, FieldLabel, Select, TextArea } from "@/components/ui";
import { apiFetch, ensureCsrfCookie, type FindingDecisionKind, type SwarmFinding } from "@/lib/api";

const labels: Record<FindingDecisionKind, string> = { false_positive: "False positive", accepted_risk: "Accepted risk" };

function useDecisionRequest(jobId: string, fingerprint: string, queryKey: QueryKey) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (body: { decision: FindingDecisionKind; reason: string } | null) => {
      await ensureCsrfCookie();
      return apiFetch(`/api/jobs/${jobId}/findings/${fingerprint}/decision`, body
        ? { method: "PUT", body: JSON.stringify(body) }
        : { method: "DELETE" });
    },
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
}

export function DismissFinding({ jobId, finding, queryKey }: { jobId: string; finding: SwarmFinding; queryKey: QueryKey }) {
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<FindingDecisionKind>("false_positive");
  const [reason, setReason] = useState("");
  const request = useDecisionRequest(jobId, finding.fingerprint ?? "", queryKey);
  if (!finding.fingerprint) return null;
  if (!open) return <div className="finding-decision"><Button type="button" variant="ghost" onClick={() => setOpen(true)}>Dismiss</Button></div>;
  return <form className="finding-decision space-y-3" onSubmit={(event) => { event.preventDefault(); request.mutate({ decision, reason: reason.trim() }); }}>
    <label className="block space-y-1"><FieldLabel>Why dismiss this?</FieldLabel>
      <Select value={decision} onChange={(event) => setDecision(event.target.value as FindingDecisionKind)}>
        <option value="false_positive">{labels.false_positive}</option>
        <option value="accepted_risk">{labels.accepted_risk}</option>
      </Select>
    </label>
    <label className="block space-y-1"><FieldLabel>Reason</FieldLabel>
      <TextArea required minLength={3} maxLength={500} rows={2} value={reason} onChange={(event) => setReason(event.target.value)} />
    </label>
    <p className="text-xs text-ink-muted">Applies to future audits of this source. Do not include secrets.</p>
    {request.isError ? <p role="alert" className="text-sm text-danger">{request.error.message}</p> : null}
    <div className="flex flex-wrap gap-2">
      <Button type="submit" disabled={request.isPending || reason.trim().length < 3}>{request.isPending ? "Saving…" : "Save decision"}</Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
    </div>
  </form>;
}

export function DismissedFindings({ jobId, findings, queryKey }: { jobId: string; findings: SwarmFinding[]; queryKey: QueryKey }) {
  if (findings.length === 0) return null;
  return <section className="audit-findings" aria-label="Dismissed findings">
    <div className="audit-section-heading"><h2>Dismissed</h2><span>{findings.length}</span></div>
    {findings.map((finding) => <DismissedFinding key={finding.fingerprint} jobId={jobId} finding={finding} queryKey={queryKey} />)}
  </section>;
}

function DismissedFinding({ jobId, finding, queryKey }: { jobId: string; finding: SwarmFinding; queryKey: QueryKey }) {
  const request = useDecisionRequest(jobId, finding.fingerprint ?? "", queryKey);
  return <article className="audit-finding">
    <span className="finding-severity" data-severity={finding.severity}>{finding.severity}</span>
    <h3>{finding.title}</h3>
    <p className="finding-detail"><strong>{finding.decision ? labels[finding.decision.kind] : ""}:</strong> {finding.decision?.reason}</p>
    {request.isError ? <p role="alert" className="text-sm text-danger">{request.error.message}</p> : null}
    <div className="finding-decision"><Button type="button" variant="ghost" disabled={request.isPending} onClick={() => request.mutate(null)}>Restore</Button></div>
  </article>;
}
