"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ensureCsrfCookie, type DeletionPendingResponse, type InputCleanupResponse, type SwarmSchedule } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { Button, TextArea } from "@/components/ui";
import { SourceMetadataFields } from "@/components/source-metadata-fields";
import { buildSourceMetadata } from "@/lib/source-metadata";

export function ScheduleRetentionControls({ schedule, accountId, onDeletion }: {
  schedule: SwarmSchedule;
  accountId: string;
  onDeletion: (id: string, status: "pending" | "processing" | "failed" | "completed") => void;
}) {
  const client = useQueryClient();
  const [confirm, setConfirm] = useState<"purge" | "delete" | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [content, setContent] = useState("");
  const [sourceRevision, setSourceRevision] = useState("");
  const [sourceObservedAt, setSourceObservedAt] = useState("");
  const available = schedule.retention?.inputAvailable ?? true;
  const change = useMutation({
    mutationFn: async (kind: "pause" | "resume" | "purge" | "delete" | "replace") => {
      await ensureCsrfCookie();
      if (kind === "delete") return apiFetch<DeletionPendingResponse | undefined>(`/api/schedules/${schedule.id}`, { method: "DELETE" });
      if (kind === "purge") return apiFetch<InputCleanupResponse>(`/api/schedules/${schedule.id}/purge-source`, { method: "POST" });
      return apiFetch<SwarmSchedule>(`/api/schedules/${schedule.id}`, {
        method: "PATCH", body: JSON.stringify(kind === "replace"
          ? { scope: { kind: "iac_text", format: "auto", content }, telemetry: {}, enabled: false, ...buildSourceMetadata(sourceRevision, sourceObservedAt) }
          : { enabled: kind === "resume" }),
      });
    },
    onSuccess: (result, kind) => {
      if (client.getQueryData(currentUserOptions.queryKey)?.id !== accountId) return;
      setConfirm(null);
      if (kind === "replace") { setContent(""); setSourceRevision(""); setSourceObservedAt(""); setReplacing(false); }
      if (kind === "delete") onDeletion(schedule.id, result && "status" in result ? result.status : "completed");
      void client.invalidateQueries({ queryKey: ["swarm-schedules", accountId] });
    },
  });
  const state = schedule.retention?.inputPurgeStatus;
  return (
    <div className="w-full space-y-2 text-sm" aria-label={`Retention for schedule ${schedule.name}`}>
      <p role="status" className="text-ink-muted">{state === "purged" ? "Saved input purged. Fresh input is required to resume."
        : state === "pending" || state === "failed" ? `Saved input cleanup ${state === "failed" ? "incomplete; retry scheduled" : "pending"}. The schedule is paused.`
          : !available ? "Saved input has expired. Fresh input is required to resume."
            : schedule.enabled ? "This enabled schedule retains a separate saved input copy." : "This paused schedule still retains its saved input."}</p>
      {schedule.retention?.inputExpiresAt && <p className="text-xs text-ink-muted">Saved input deadline: {new Date(schedule.retention.inputExpiresAt).toLocaleString()}</p>}
      <p className="text-xs text-ink-muted">Already dispatched audits keep their own input and deadlines. Schedule cleanup does not delete those audits.</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={change.isPending || !schedule.enabled && !available} onClick={() => change.mutate(schedule.enabled ? "pause" : "resume")}>{schedule.enabled ? "Pause" : "Resume"}</Button>
        <Button variant="secondary" disabled={change.isPending} onClick={() => setReplacing(!replacing)}>Supply fresh input</Button>
        {state !== "purged" && <Button variant="secondary" disabled={change.isPending} onClick={() => setConfirm("purge")}>Purge saved input</Button>}
        <Button variant="ghost" disabled={change.isPending} onClick={() => setConfirm("delete")}>Delete schedule</Button>
      </div>
      {replacing && <div className="space-y-2"><label className="block">Fresh IaC input<TextArea className="mt-1 min-h-28" value={content} onChange={event => setContent(event.target.value)} /></label><SourceMetadataFields idPrefix={`schedule-replacement-${schedule.id}`} revision={sourceRevision} observedAt={sourceObservedAt} onRevisionChange={setSourceRevision} onObservedAtChange={setSourceObservedAt} /><p className="text-xs text-ink-muted">Replacing input removes the previous saved snapshot and telemetry. The schedule stays paused until you resume it. Leaving both metadata fields blank clears prior source metadata.</p><Button disabled={change.isPending || !content.trim()} onClick={() => change.mutate("replace")}>Replace input and keep paused</Button></div>}
      {confirm && <div className="space-y-2 rounded-lg border border-line p-3"><p>{confirm === "purge" ? "Pause this schedule and permanently remove its saved source and telemetry?" : "Delete this schedule and its saved input? This cannot be undone."} Already dispatched audits remain separate.</p><div className="flex gap-2"><Button disabled={change.isPending} onClick={() => change.mutate(confirm)}>{confirm === "purge" ? "Confirm saved input purge" : "Confirm schedule deletion"}</Button><Button variant="secondary" disabled={change.isPending} onClick={() => setConfirm(null)}>Keep schedule</Button></div></div>}
      {change.isError && <p role="alert" className="text-danger">{change.error.message}</p>}
    </div>
  );
}

export function ScheduleDeletionStatus({ id, initialStatus }: { id: string; initialStatus: "pending" | "processing" | "failed" | "completed" }) {
  const check = useMutation({ mutationFn: async () => {
    await ensureCsrfCookie();
    return apiFetch<DeletionPendingResponse | undefined>(`/api/schedules/${id}`, { method: "DELETE" });
  } });
  const status = check.isSuccess ? check.data?.status ?? "completed" : initialStatus;
  return <div className="space-y-2 rounded-lg border border-line p-3 text-sm"><p className="font-mono text-xs">{id}</p><p role="status">{status === "completed" ? "Schedule deletion completed. Dispatched audits remain separate." : status === "processing" ? "Schedule deletion is processing. It is hidden and cannot dispatch new audits." : "Schedule deletion incomplete. It is hidden and cannot dispatch new audits."}</p>{status !== "completed" && <Button variant="secondary" disabled={check.isPending} onClick={() => check.mutate()}>Check schedule deletion</Button>}{check.isError && <p role="alert" className="text-danger">{check.error.message}</p>}</div>;
}
