"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ensureCsrfCookie, type DeletionPendingResponse, type InputCleanupResponse, type SwarmJob } from "@/lib/api";
import { Button } from "@/components/ui";

export function JobRetentionControls({ job, accountId, onDeletion }: {
  job: SwarmJob;
  accountId: string;
  onDeletion: (jobId: string, status: "pending" | "failed" | "completed") => void;
}) {
  const client = useQueryClient();
  const [confirm, setConfirm] = useState<"input" | "history" | "cancel" | null>(null);
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
    mutationFn: () => apiFetch<unknown>(`/api/jobs/${job.id}/compliance-report`),
    onSuccess: (data) => {
      if (!ownsView()) return;
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-${job.id}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  });

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
          <div className="flex flex-wrap gap-2">
            {retention?.inputPurgeStatus !== "purged" && <Button type="button" variant="secondary" disabled={cleanup.isPending} onClick={() => setConfirm("input")}>Purge audit input</Button>}
            <Button type="button" variant="secondary" disabled={cleanup.isPending} onClick={() => setConfirm("history")}>Delete audit</Button>
            <Button type="button" variant="secondary" disabled={report.isPending} onClick={() => report.mutate()}>Export report</Button>
          </div>
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

export function JobDeletionStatus({ jobId, initialStatus }: { jobId: string; initialStatus: "pending" | "failed" | "completed" }) {
  const check = useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie();
      return apiFetch<DeletionPendingResponse | undefined>(`/api/jobs/${jobId}`, { method: "DELETE" });
    },
  });
  const status = check.isSuccess ? check.data?.status ?? "completed" : initialStatus;
  return (
    <div className="space-y-2 rounded-[10px] border border-line p-3 text-sm">
      <p className="font-mono text-xs text-ink-muted">{jobId}</p>
      <p role="status">{status === "completed" ? "Audit deletion completed across live stores." : status === "failed" ? "Audit deletion incomplete. It stays hidden while cleanup retries." : "Audit deletion pending. It is hidden from normal reads."}</p>
      {status !== "completed" && <Button type="button" variant="secondary" disabled={check.isPending} onClick={() => check.mutate()}>Check deletion status</Button>}
      {check.isError && <p role="alert" className="text-danger">{check.error.message}</p>}
    </div>
  );
}
