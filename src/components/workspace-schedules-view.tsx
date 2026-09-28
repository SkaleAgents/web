"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button, TextArea } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { type AuditWorkspace } from "@/lib/workspace-audits";
import {
  createWorkspaceSchedule, deleteWorkspaceSchedule, listWorkspaceSchedules,
  purgeWorkspaceSchedule, updateWorkspaceSchedule, workspaceSchedulesEnabled,
  type WorkspaceSchedule, type WorkspaceScheduleInput,
} from "@/lib/workspace-schedules";

export function WorkspaceSchedulesView() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  return <WorkspaceSchedulesPage workspaceId={workspaceId} />;
}

export function WorkspaceSchedulesPage({ workspaceId }: { workspaceId: string }) {
  if (!workspaceSchedulesEnabled()) return <main className="space-y-4"><h1 className="workspace-heading">Shared schedules</h1><p className="text-sm text-ink-muted">Shared schedules are not enabled for this deployment.</p></main>;
  return <WorkspaceSchedules workspaceId={workspaceId} />;
}

function WorkspaceSchedules({ workspaceId }: { workspaceId: string }) {
  const client = useQueryClient();
  const user = useQuery(currentUserOptions);
  const accountId = user.data?.id;
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [cron, setCron] = useState("0 0 * * 1");
  const [timezone, setTimezone] = useState("UTC");
  const [content, setContent] = useState("");
  const [confirm, setConfirm] = useState<{ kind: "purge" | "delete"; id: string } | null>(null);
  const [cleanupStatus, setCleanupStatus] = useState<string | null>(null);
  const workspaceQuery = useQuery({
    queryKey: ["workspaces", accountId ?? "guest"], enabled: Boolean(accountId),
    queryFn: async ({ signal }) => {
      const response = await apiFetch<{ data: AuditWorkspace[] }>("/api/workspaces", { signal });
      if (client.getQueryData(currentUserOptions.queryKey)?.id !== accountId) throw new Error("Your account changed. Reload organization access.");
      return response.data;
    },
  });
  const workspace = workspaceQuery.data?.find((item) => item.id === workspaceId);
  const key = ["workspace-schedules", accountId ?? "guest", workspaceId] as const;
  const schedules = useQuery({
    queryKey: key, enabled: Boolean(accountId && workspace),
    queryFn: async ({ signal }) => {
      const result = await listWorkspaceSchedules(workspaceId, signal);
      if (client.getQueryData(currentUserOptions.queryKey)?.id !== accountId) throw new Error("Your account changed. Reload organization access.");
      return result;
    },
    refetchInterval: (query) => query.state.data?.some((item) => item.retention?.inputPurgeStatus === "pending") ? 5000 : false,
  });
  const canEdit = workspace?.role === "owner" || workspace?.role === "member";
  const canClean = workspace?.role === "owner";
  const create = useMutation({
    mutationFn: async (input: WorkspaceScheduleInput) => createWorkspaceSchedule(workspaceId, input),
    onSuccess: () => { if (client.getQueryData(currentUserOptions.queryKey)?.id === accountId) { setFormOpen(false); setContent(""); void client.invalidateQueries({ queryKey: key }); } },
  });
  const update = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<WorkspaceScheduleInput> }) => updateWorkspaceSchedule(workspaceId, id, changes),
    onSuccess: () => { if (client.getQueryData(currentUserOptions.queryKey)?.id === accountId) void client.invalidateQueries({ queryKey: key }); },
  });
  const purge = useMutation({
    mutationFn: (id: string) => purgeWorkspaceSchedule(workspaceId, id),
    onSuccess: (result) => { if (client.getQueryData(currentUserOptions.queryKey)?.id === accountId) { setConfirm(null); setCleanupStatus(`Input cleanup ${result.inputPurgeStatus ?? "pending"}.`); void client.invalidateQueries({ queryKey: key }); } },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteWorkspaceSchedule(workspaceId, id),
    onSuccess: (result) => { if (client.getQueryData(currentUserOptions.queryKey)?.id === accountId) { setConfirm(null); setCleanupStatus(result ? `Schedule deletion ${result.status ?? "pending"}.` : "Schedule deleted."); void client.invalidateQueries({ queryKey: key }); } },
  });
  useEffect(() => {
    if (!accountId || !workspaceQuery.data) return;
    const memberships = new Set(workspaceQuery.data.map((item) => item.id));
    for (const query of client.getQueryCache().getAll()) {
      const [kind, cachedAccountId, cachedWorkspaceId] = query.queryKey;
      if (kind === "workspace-schedules" && cachedAccountId === accountId && typeof cachedWorkspaceId === "string" && !memberships.has(cachedWorkspaceId)) {
        void client.removeQueries({ queryKey: query.queryKey, exact: true });
      }
    }
  }, [accountId, client, workspaceQuery.data]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    create.mutate({ name: name.trim(), cronExpression: cron.trim(), timezone: timezone.trim(), scope: { kind: "iac_text", format: "auto", content: content.trim() }, specialists: ["devsecops", "sre"] });
  }
  if (user.isPending || accountId && workspaceQuery.isPending) return <main><p role="status">Checking organization access…</p></main>;
  if (user.isError || !accountId || workspaceQuery.isError || !workspace) return <main><h1 className="workspace-heading">Organization unavailable</h1><p role="alert" className="mt-2 text-sm text-ink-muted">You cannot view schedules in this organization.</p></main>;
  return <main className="space-y-8">
    <div className="workspace-intro">
      <p className="workspace-kicker">Organizations / Scheduled audits</p>
      <h1 className="workspace-heading">{workspace.name} schedules</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-muted">Shared schedules belong to this organization. Current members can see them even if the creator leaves.</p>
      <Link href={`/dashboard/workspaces/${workspaceId}/jobs`} className="mt-3 inline-flex text-sm font-semibold text-accent hover:underline">Shared audit history</Link>
    </div>
    {canEdit && <div><Button onClick={() => setFormOpen((value) => !value)}>{formOpen ? "Close form" : "Create schedule"}</Button></div>}
    {formOpen && canEdit && <form onSubmit={submit} className="max-w-3xl space-y-4 rounded-[10px] border border-line bg-canvas-elevated p-5">
      <label className="block text-sm font-medium">Name<input className="mt-1 w-full rounded-md border border-line bg-canvas px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} required /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Cron expression<input className="mt-1 w-full rounded-md border border-line bg-canvas px-3 py-2" value={cron} onChange={(event) => setCron(event.target.value)} required /></label><label className="block text-sm font-medium">Timezone<input className="mt-1 w-full rounded-md border border-line bg-canvas px-3 py-2" value={timezone} onChange={(event) => setTimezone(event.target.value)} required /></label></div>
      <label htmlFor="shared-schedule-source" className="block text-sm font-medium">Infrastructure configuration</label>
      <TextArea id="shared-schedule-source" className="min-h-32" value={content} onChange={(event) => setContent(event.target.value)} required />
      <Button type="submit" disabled={create.isPending || !name.trim() || !content.trim()}>{create.isPending ? "Creating…" : "Save schedule"}</Button>
      {create.isError && <p role="alert" className="text-sm text-danger">{create.error.message}</p>}
    </form>}
    <section className="space-y-4" aria-label="Shared schedule list">
      {schedules.isPending && <p role="status">Loading shared schedules…</p>}
      {schedules.isError && <p role="alert" className="text-sm text-danger">{schedules.error.message}</p>}
      {schedules.data?.length === 0 && <p className="text-sm text-ink-muted">No shared schedules yet.</p>}
      <ul className="divide-y divide-line">{schedules.data?.map((item: WorkspaceSchedule) => <li key={item.id} className="space-y-3 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-semibold text-ink">{item.name}</h2><p className="mt-1 text-sm text-ink-muted">{item.enabled ? "Active" : "Paused"} · {item.cronExpression} · {item.timezone}</p>{item.lastError && <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">{item.lastError}</p>}{item.retention?.inputPurgeStatus !== "retained" && <p className="mt-1 text-sm text-ink-muted">Input cleanup: {item.retention?.inputPurgeStatus ?? "unknown"}</p>}</div>
        <div className="flex flex-wrap gap-2">{item.lastJobId && <Link href={`/dashboard/workspaces/${workspaceId}/jobs`} className="inline-flex items-center text-sm font-semibold text-accent hover:underline">Open last audit</Link>}{canEdit && <Button variant="secondary" disabled={update.isPending} onClick={() => update.mutate({ id: item.id, changes: { enabled: !item.enabled } })}>{item.enabled ? "Pause" : "Resume"}</Button>}{canClean && <><Button variant="secondary" onClick={() => setConfirm({ kind: "purge", id: item.id })}>Purge input</Button><Button variant="secondary" onClick={() => setConfirm({ kind: "delete", id: item.id })}>Delete schedule</Button></>}</div></div>
        {canEdit && <ScheduleEdit item={item} busy={update.isPending} onSave={(changes) => update.mutate({ id: item.id, changes })} />}
      </li>)}</ul>
    </section>
    {confirm && canClean && <div className="max-w-xl space-y-3 rounded-[10px] border border-line p-4"><p className="text-sm text-ink">{confirm.kind === "purge" ? "Purge saved input for this schedule? It will pause until fresh input is supplied." : "Delete this schedule definition? Existing audit jobs remain."}</p><div className="flex gap-2"><Button disabled={purge.isPending || remove.isPending} onClick={() => confirm.kind === "purge" ? purge.mutate(confirm.id) : remove.mutate(confirm.id)}>{confirm.kind === "purge" ? "Confirm purge" : "Confirm deletion"}</Button><Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button></div></div>}
    {cleanupStatus && <p role="status" className="text-sm text-ink-muted">{cleanupStatus}</p>}
    {update.isError && <p role="alert" className="text-sm text-danger">{update.error.message}</p>}
    {purge.isError && <p role="alert" className="text-sm text-danger">{purge.error.message}</p>}
    {remove.isError && <p role="alert" className="text-sm text-danger">{remove.error.message}</p>}
  </main>;
}

function ScheduleEdit({ item, busy, onSave }: { item: WorkspaceSchedule; busy: boolean; onSave: (changes: Partial<WorkspaceScheduleInput>) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [cron, setCron] = useState(item.cronExpression);
  const [timezone, setTimezone] = useState(item.timezone);
  const [freshSource, setFreshSource] = useState("");
  return <div className="space-y-3"><Button variant="secondary" onClick={() => setOpen((value) => !value)}>{open ? "Close settings" : "Edit settings"}</Button>{open && <form className="grid max-w-3xl gap-3 sm:grid-cols-3" onSubmit={(event) => { event.preventDefault(); onSave({ name: name.trim(), cronExpression: cron.trim(), timezone: timezone.trim(), ...(freshSource.trim() ? { scope: { kind: "iac_text", format: "auto", content: freshSource.trim() } } : {}) }); setOpen(false); setFreshSource(""); }}><label className="text-sm">Name<input className="mt-1 w-full rounded-md border border-line bg-canvas px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} required /></label><label className="text-sm">Cron expression<input className="mt-1 w-full rounded-md border border-line bg-canvas px-3 py-2" value={cron} onChange={(event) => setCron(event.target.value)} required /></label><label className="text-sm">Timezone<input className="mt-1 w-full rounded-md border border-line bg-canvas px-3 py-2" value={timezone} onChange={(event) => setTimezone(event.target.value)} required /></label><label className="text-sm sm:col-span-3">Fresh infrastructure configuration (optional)<TextArea className="mt-1 min-h-24" value={freshSource} onChange={(event) => setFreshSource(event.target.value)} placeholder="Leave blank to keep the current saved input" /></label><Button type="submit" disabled={busy}>Save changes</Button></form>}</div>;
}
