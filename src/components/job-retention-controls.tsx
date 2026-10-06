"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ensureCsrfCookie, type DeletionPendingResponse, type InputCleanupResponse, type SwarmJob } from "@/lib/api";
import { reportToCsv, reportToJson, reportToPdf, type ComplianceReport, type ReportSource } from "@/lib/compliance-report-export";
import { submittedAuditText } from "@/lib/review-edits";
import { Button } from "@/components/ui";

const reportFormats = [
  { id: "json", label: "JSON", filename: (jobId: string) => `audit-${jobId}.json`, type: "application/json" },
  { id: "pdf", label: "PDF", filename: (jobId: string) => `audit-${jobId}.pdf`, type: "application/pdf" },
  { id: "csv", label: "CSV", filename: (jobId: string) => `audit-${jobId}.csv`, type: "text/csv" },
] as const;

type ReportFormat = (typeof reportFormats)[number]["id"];

function downloadReport(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function reportFile(format: ReportFormat, jobId: string, data: ComplianceReport, source: ReportSource): { name: string; blob: Blob } {
  const choice = reportFormats.find((item) => item.id === format) ?? reportFormats[0];
  if (format === "pdf") {
    const pdf = reportToPdf(data, source);
    const body = new ArrayBuffer(pdf.byteLength);
    new Uint8Array(body).set(pdf);
    return { name: choice.filename(jobId), blob: new Blob([body], { type: choice.type }) };
  }
  const text = format === "csv" ? reportToCsv(data, source) : reportToJson(data, source);
  return { name: choice.filename(jobId), blob: new Blob([text], { type: choice.type }) };
}

export function JobRetentionControls({ job, accountId, onDeletion }: {
  job: SwarmJob;
  accountId: string;
  onDeletion: (jobId: string, status: "pending" | "processing" | "failed" | "completed") => void;
}) {
  const client = useQueryClient();
  const [confirm, setConfirm] = useState<"input" | "history" | "cancel" | null>(null);
  const [formatsOpen, setFormatsOpen] = useState(false);
  const formatMenu = useRef<HTMLDivElement>(null);
  const formatTrigger = useRef<HTMLButtonElement>(null);
  const formatMenuId = useId();
  const terminal = job.status === "completed" || job.status === "failed";
  const retention = job.retention;
  const ownsView = () => client.getQueryData<{ id: string } | null>(["user"])?.id === accountId;
  const cancel = useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie();
      return apiFetch<SwarmJob>(`/api/jobs/${job.id}/cancel`, { method: "POST" });
    },
    onSuccess: () => {
      if (!ownsView()) return;
      setConfirm(null);
      void client.invalidateQueries({ queryKey: ["swarm-jobs", accountId] });
      void client.invalidateQueries({ queryKey: ["swarm-job", job.id, accountId] });
    },
  });
  const cleanup = useMutation({
    mutationFn: async (kind: "input" | "history") => {
      await ensureCsrfCookie();
      if (kind === "input") {
        return apiFetch<InputCleanupResponse>(`/api/jobs/${job.id}/purge-source`, { method: "POST" });
      }
      return apiFetch<DeletionPendingResponse | undefined>(`/api/jobs/${job.id}`, { method: "DELETE" });
    },
    onSuccess: (result, kind) => {
      if (!ownsView()) return;
      setConfirm(null);
      if (kind === "history") onDeletion(job.id, result && "status" in result ? result.status : "completed");
      void client.invalidateQueries({ queryKey: ["swarm-jobs", accountId] });
      void client.invalidateQueries({ queryKey: ["swarm-job", job.id, accountId] });
      void client.invalidateQueries({ queryKey: ["watchtower-session"] });
    },
  });
  const report = useMutation({
    mutationFn: async (format: ReportFormat) => {
      const data = await apiFetch<ComplianceReport>(`/api/jobs/${job.id}/compliance-report`);
      return { format, data };
    },
    onSuccess: ({ format, data }) => {
      if (!ownsView()) return;
      const file = reportFile(format, job.id, data, { content: submittedAuditText(job) });
      downloadReport(file.name, file.blob);
    },
  });
  useEffect(() => {
    if (!formatsOpen) return;
    formatMenu.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    function dismiss(event: PointerEvent) {
      if (!formatMenu.current?.parentElement?.contains(event.target as Node)) setFormatsOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [formatsOpen]);

  return (
    <div className="w-full space-y-2 text-sm" aria-label={`Retention for audit ${job.id}`}>
      {!terminal && <>
        <p className="text-ink-muted">Input retained while this audit is active. Cancel it or wait for completion before cleanup.</p>
        <Button type="button" variant="secondary" onClick={() => setConfirm("cancel")}>Cancel audit</Button>
      </>}
      {terminal && (
        <>
          <p className="text-ink-muted" role="status">
            {retention?.inputPurgeStatus === "purged" ? "Input cleanup completed across live stores."
              : retention?.inputPurgeStatus === "pending" ? "Input cleanup pending. Input is hidden while removal finishes."
                : retention?.inputPurgeStatus === "failed" ? "Input cleanup incomplete. Input is hidden; the cleaner will retry."
                  : job.sourcePurged ? "Source content was previously purged. Other input may remain."
                    : "Audit input is retained."}
          </p>
          <p className="text-xs text-ink-muted">
            {retention?.inputExpiresAt ? `Input deadline: ${new Date(retention.inputExpiresAt).toLocaleString()}. ` : "Automatic input expiry is not enabled for this audit. "}
            {retention?.historyExpiresAt && `History deadline: ${new Date(retention.historyExpiresAt).toLocaleString()}.`}
          </p>
          {job.scheduleId && <p className="text-xs text-ink-muted">The recurring schedule keeps a separate input copy. Cleaning this job does not clean its schedule or other runs.</p>}
          <p className="text-sm text-ink-muted">Download a copy as JSON, PDF, or CSV. Findings stay readable on this page. A spreadsheet row with no finding is not a pass.</p>
          <div className="audit-report-actions relative inline-flex" onKeyDown={(event) => {
            if (event.key === "Escape" && formatsOpen) {
              event.preventDefault();
              setFormatsOpen(false);
              formatTrigger.current?.focus();
            }
          }}>
            <Button ref={formatTrigger} type="button" aria-haspopup="menu" aria-expanded={formatsOpen} aria-controls={formatMenuId} disabled={report.isPending} onClick={() => setFormatsOpen((open) => !open)}>
              {report.isPending ? "Preparing report…" : "Download report"}
            </Button>
            {formatsOpen && <div ref={formatMenu} id={formatMenuId} role="menu" aria-label="Report file type" className="absolute left-0 top-full z-20 mt-2 w-36 rounded-[10px] border border-line bg-canvas-elevated p-1 shadow-lg">
              {reportFormats.map((format) => (
                <button key={format.id} type="button" role="menuitem" className="block w-full rounded-md px-3 py-2 text-left text-ink hover:bg-canvas focus:bg-canvas focus:outline-none" onClick={() => {
                  setFormatsOpen(false);
                  report.mutate(format.id);
                }}>{format.label}</button>
              ))}
            </div>}
          </div>
          <details className="audit-data-actions"><summary>Manage retained data</summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {retention?.inputPurgeStatus !== "purged" && <Button type="button" variant="secondary" disabled={cleanup.isPending} onClick={() => setConfirm("input")}>Purge audit input</Button>}
            <Button type="button" variant="secondary" disabled={cleanup.isPending} onClick={() => setConfirm("history")}>Delete audit</Button>
          </div>
          </details>
          <p className="text-xs text-ink-muted">Downloaded reports and copies already delivered to webhook recipients are outside server-side cleanup. Live-store completion does not confirm backup deletion.</p>
        </>
      )}
      {confirm && (
        <div className="space-y-2 rounded-[10px] border border-line p-3">
          <p>{confirm === "cancel" ? "Cancel this active audit? Cleanup becomes available after cancellation is recorded." : confirm === "input" ? "Remove this audit's source, telemetry, redirects, patches, and unclassified text? You will need fresh input to run it again." : "Delete this audit and its Watchtower history? This cannot be undone. Schedule snapshots and other audits are separate copies."}</p>
          <div className="flex gap-2">
            <Button type="button" disabled={cleanup.isPending || cancel.isPending} onClick={() => confirm === "cancel" ? cancel.mutate() : cleanup.mutate(confirm)}>{cleanup.isPending || cancel.isPending ? "Requesting…" : confirm === "cancel" ? "Confirm cancellation" : confirm === "input" ? "Confirm input purge" : "Confirm audit deletion"}</Button>
            <Button type="button" variant="secondary" disabled={cleanup.isPending || cancel.isPending} onClick={() => setConfirm(null)}>Keep audit</Button>
          </div>
        </div>
      )}
      {(cleanup.isError || report.isError || cancel.isError) && <p role="alert" className="text-danger">{cleanup.error?.message ?? report.error?.message ?? cancel.error?.message}</p>}
    </div>
  );
}

export function JobDeletionStatus({ jobId, initialStatus, accountId }: { jobId: string; initialStatus: "pending" | "processing" | "failed" | "completed"; accountId: string }) {
  const check = useQuery({
    queryKey: ["swarm-job-deletion-status", accountId, jobId],
    enabled: initialStatus !== "completed",
    queryFn: async ({ signal }): Promise<DeletionPendingResponse | { ok: true; status: "completed" }> => {
      await ensureCsrfCookie(signal);
      const result = await apiFetch<DeletionPendingResponse | undefined>(`/api/jobs/${jobId}`, { method: "DELETE", signal });
      return result ?? { ok: true, status: "completed" };
    },
    refetchInterval: (query) => query.state.data?.status === "completed" ? false : query.state.data || query.state.status === "error" ? 3000 : false,
  });
  const status = check.data?.status ?? initialStatus;
  return (
    <div className="space-y-2 rounded-[10px] border border-line p-3 text-sm">
      <p className="font-mono text-xs text-ink-muted">{jobId}</p>
      <p role="status">{status === "completed" ? "Audit deletion completed across live stores." : status === "failed" ? "Audit deletion incomplete. It stays hidden while cleanup retries." : status === "processing" ? "Audit deletion is processing. Status refreshes automatically." : "Audit deletion pending. It is hidden from normal reads. Status refreshes automatically."}</p>
      {status !== "completed" && <Button type="button" variant="secondary" disabled={check.isFetching} onClick={() => void check.refetch()}>Refresh deletion status</Button>}
      {check.isError && <p role="alert" className="text-danger">{check.error.message}</p>}
    </div>
  );
}
