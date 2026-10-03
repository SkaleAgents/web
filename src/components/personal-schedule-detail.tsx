"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, type SwarmSchedule } from "@/lib/api";
import { LinkButton } from "@/components/ui";
import { currentUserOptions } from "@/lib/session";
import { ScheduleDeletionStatus, ScheduleRetentionControls } from "@/components/schedule-retention-controls";
import { SourceMetadata } from "@/components/source-metadata";
import { personalDestinationFromPath } from "@/lib/dashboard-routes";
import { scheduleCadenceLabel } from "@/lib/schedule-cadence";

export function PersonalScheduleDetail({ id }: { id: string }) {
  const pathname = usePathname();
  const href = (section: string) => personalDestinationFromPath(pathname, section);
  const user = useQuery(currentUserOptions);
  const accountId = user.data?.id;
  const [deletion, setDeletion] = useState<"pending" | "processing" | "failed" | "completed" | null>(null);
  const schedules = useQuery({
    queryKey: ["swarm-schedules", accountId ?? "guest"],
    enabled: Boolean(accountId) && !deletion,
    queryFn: async ({ signal }) => (await apiFetch<{ schedules: SwarmSchedule[] }>("/api/schedules", { signal })).schedules,
    refetchInterval: (query) => query.state.data?.some((schedule) => schedule.id === id && ["pending", "failed"].includes(schedule.retention?.inputPurgeStatus ?? "")) ? 5000 : false,
  });
  const schedule = schedules.data?.find((item) => item.id === id);
  const source = schedule?.scope?.kind === "repo_ref" && typeof schedule.scope.ref === "string" ? schedule.scope.ref : "Saved text";

  return (
    <main className="space-y-8">
      <LinkButton href={href("schedules")} variant="secondary">Back to schedules</LinkButton>
      {user.isPending && <p className="text-sm text-ink-muted">Loading account…</p>}
      {!user.isPending && !user.data && <p className="text-sm text-ink-muted">Sign in to view this schedule.</p>}
      {deletion && <ScheduleDeletionStatus id={id} initialStatus={deletion} />}
      {!deletion && accountId && schedules.isPending && <p className="text-sm text-ink-muted">Loading schedule…</p>}
      {!deletion && accountId && schedules.isError && <p role="alert" className="text-sm text-danger">{schedules.error.message}</p>}
      {!deletion && accountId && schedules.data && !schedule && <p className="text-sm text-ink-muted">This schedule is unavailable or has been removed.</p>}
      {!deletion && schedule && (
        <>
          <div className="workspace-intro">
            <p className="workspace-kicker">Review / Make it repeatable</p>
            <h1 className="workspace-heading">{schedule.name}</h1>
            <p className="mt-2 text-sm text-ink-muted">{schedule.enabled ? "Active" : "Paused"} · {scheduleCadenceLabel(schedule.cronExpression)} · {schedule.timezone}</p>
          </div>
          <section className="space-y-3 rounded-[10px] border border-line bg-canvas-elevated p-5" aria-label="Schedule details">
            <p className="text-sm text-ink-muted">Next run: {schedule.enabled && schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleString() : "Not scheduled"}</p>
            <p className="text-sm text-ink-muted">Last run: {schedule.lastRunAt ? new Date(schedule.lastRunAt).toLocaleString() : "None yet"}</p>
            <p className="text-sm text-ink-muted">Webhook: {schedule.webhookConfigured ? "Configured" : "Not configured"}</p>
            <p className="text-sm text-ink-muted">Scanned revision: {schedule.sourceRevision?.trim() ? schedule.sourceRevision : "No revision has been recorded"}</p>
            <p className="text-sm text-ink-muted">Webhook result: {schedule.webhookResult === "delivered" ? "Delivered" : schedule.webhookResult === "failed" ? "Failed" : "None"}</p>
            <p className="break-all font-mono text-xs text-ink-muted">{schedule.cronExpression}</p>
            <p className="break-all text-sm text-ink-muted">Source: {source}</p>
            <SourceMetadata sourceRevision={schedule.sourceRevision} sourceObservedAt={schedule.sourceObservedAt} inputAvailable={schedule.retention?.inputAvailable} verified={schedule.scope?.kind === "repo_ref"} />
            {schedule.lastError && <p role="alert" className="text-sm text-danger">{schedule.lastError}</p>}
          </section>
          {accountId && <ScheduleRetentionControls schedule={schedule} accountId={accountId} onDeletion={(_scheduleId, status) => setDeletion(status)} />}
        </>
      )}
    </main>
  );
}
