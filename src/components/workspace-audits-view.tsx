"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, TextArea } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import {
  createWorkspaceAudit,
  deleteWorkspaceAudit,
  getWorkspaceAudit,
  isWorkspaceAuditUnavailable,
  listWorkspaceAudits,
  purgeWorkspaceAuditSource,
  workspaceAuditsEnabled,
  type AuditWorkspace,
  type WorkspaceAuditDetail,
} from "@/lib/workspace-audits";

export function WorkspaceAuditsView() {
  const params = useParams<{ workspaceId: string }>();
  return <WorkspaceAuditsPage workspaceId={params.workspaceId} />;
}

export function WorkspaceAuditsPage({ workspaceId }: { workspaceId: string }) {
  if (!workspaceAuditsEnabled()) {
    return <main className="space-y-4"><h1 className="workspace-heading">Shared audits</h1><p className="text-sm text-ink-muted">Shared audits are not enabled for this deployment.</p></main>;
  }
  return <WorkspaceAudits workspaceId={workspaceId} />;
}

function WorkspaceAudits({ workspaceId }: { workspaceId: string }) {
  const client = useQueryClient();
  const user = useQuery(currentUserOptions);
  const accountId = user.data?.id;
  const workspaceKey = ["workspaces", accountId ?? "guest"] as const;
  const [content, setContent] = useState("");
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [deleteStates, setDeleteStates] = useState<Record<string, "pending" | "failed">>({});
  const unavailableKey = useMemo(() => ["workspace-audits-unavailable", accountId ?? "guest", workspaceId] as const, [accountId, workspaceId]);
  const unavailableQuery = useQuery({ queryKey: unavailableKey, queryFn: async () => false, enabled: false, initialData: false });
  const workspaceQuery = useQuery({
    queryKey: workspaceKey,
    enabled: Boolean(accountId),
    queryFn: async ({ signal }) => {
      const response = await apiFetch<{ data: AuditWorkspace[] }>("/api/workspaces", { signal });
      if (client.getQueryData(currentUserOptions.queryKey)?.id !== accountId) throw new Error("Your account changed. Reload workspace access before continuing.");
      return response.data;
    },
  });
  const workspace = workspaceQuery.data?.find((item) => item.id === workspaceId);
  const role = workspace?.role;
  const canCreate = role === "owner" || role === "member";
  const canManage = role === "owner";
  const auditKey = useMemo(() => ["workspace-audits", accountId ?? "guest", workspaceId] as const, [accountId, workspaceId]);
  const audits = useQuery({
    queryKey: auditKey,
    enabled: Boolean(accountId && workspace && !unavailableQuery.data),
    queryFn: async ({ signal }) => {
      const data = await listWorkspaceAudits(workspaceId, signal);
      if (client.getQueryData(currentUserOptions.queryKey)?.id !== accountId) throw new Error("Your account changed. Reload workspace access before continuing.");
      return data;
    },
    refetchInterval: (query) => query.state.data?.some((audit) => audit.status === "queued" || audit.status === "running" || audit.retention?.inputPurgeStatus === "pending") ? 5000 : false,
  });
  const selectedKey = ["workspace-audit-detail", accountId ?? "guest", workspaceId, selectedAuditId] as const;
  const detail = useQuery({
    queryKey: selectedKey,
    enabled: Boolean(accountId && workspace && selectedAuditId && !unavailableQuery.data),
    queryFn: async ({ signal }) => {
      const result = await getWorkspaceAudit(workspaceId, selectedAuditId!, signal);
      if (result.workspaceId !== workspaceId) throw new Error("The audit response did not match this workspace.");
      if (client.getQueryData(currentUserOptions.queryKey)?.id !== accountId) throw new Error("Your account changed. Reload workspace access before continuing.");
      return result;
    },
  });
  const create = useMutation({
    mutationFn: () => createWorkspaceAudit(workspaceId, content.trim()),
    onSuccess: (audit) => {
      if (client.getQueryData(currentUserOptions.queryKey)?.id !== accountId || audit.workspaceId !== workspaceId) return;
      setContent("");
      setSelectedAuditId(audit.id);
      void client.invalidateQueries({ queryKey: auditKey });
    },
  });
  const purge = useMutation({
    mutationFn: (auditId: string) => purgeWorkspaceAuditSource(workspaceId, auditId),
    onSuccess: (response, auditId) => {
      if (client.getQueryData(currentUserOptions.queryKey)?.id !== accountId) return;
      client.setQueryData<WorkspaceAuditDetail>(["workspace-audit-detail", accountId, workspaceId, auditId], (current) => current ? {
        ...current,
        sourcePurged: response.sourcePurged,
        retention: response.retention ?? current.retention,
      } : current);
      void client.invalidateQueries({ queryKey: auditKey });
    },
  });
  const remove = useMutation({
    mutationFn: (auditId: string) => deleteWorkspaceAudit(workspaceId, auditId),
    onSuccess: (response, auditId) => {
      if (client.getQueryData(currentUserOptions.queryKey)?.id !== accountId) return;
      if (response && response.status !== "pending") setDeleteStates((state) => ({ ...state, [auditId]: response.status }));
      else if (response) setDeleteStates((state) => ({ ...state, [auditId]: "pending" }));
      else setDeleteStates((state) => { const next = { ...state }; delete next[auditId]; return next; });
      if (selectedAuditId === auditId) setSelectedAuditId(null);
      void client.invalidateQueries({ queryKey: auditKey });
      void client.removeQueries({ queryKey: ["workspace-audit-detail", accountId, workspaceId, auditId] });
    },
  });
  const unavailable = unavailableQuery.data || [audits.error, detail.error, create.error, purge.error, remove.error].some(isWorkspaceAuditUnavailable);

  useEffect(() => {
    if (!accountId || !workspaceQuery.data) return;
    const memberWorkspaceIds = new Set(workspaceQuery.data.map((item) => item.id));
    for (const query of client.getQueryCache().getAll()) {
      const [kind, cachedAccountId, cachedWorkspaceId] = query.queryKey;
      if ((kind === "workspace-audits" || kind === "workspace-audit-detail" || kind === "workspace-audits-unavailable")
        && cachedAccountId === accountId
        && typeof cachedWorkspaceId === "string"
        && !memberWorkspaceIds.has(cachedWorkspaceId)) {
        void client.removeQueries({ queryKey: query.queryKey, exact: true });
      }
    }
  }, [accountId, client, workspaceQuery.data]);

  useEffect(() => {
    const errors = [audits.error, detail.error, create.error, purge.error, remove.error];
    if (!errors.some(isWorkspaceAuditUnavailable)) return;
    client.setQueryData(unavailableKey, true);
    void client.cancelQueries({ queryKey: auditKey });
    void client.removeQueries({ queryKey: auditKey });
    void client.removeQueries({ queryKey: ["workspace-audit-detail", accountId, workspaceId] });
  }, [accountId, auditKey, audits.error, client, create.error, detail.error, purge.error, remove.error, unavailableKey, workspaceId]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    create.mutate();
  }

  if (user.isError) return <main><h1 className="workspace-heading">Shared audits</h1><p role="alert" className="text-sm text-danger">Could not verify your account.</p></main>;
  if (user.isPending || accountId && workspaceQuery.isPending) return <main><p role="status" className="text-sm text-ink-muted">Checking workspace access…</p></main>;
  if (!accountId) return <main className="space-y-3"><h1 className="workspace-heading">Shared audits</h1><p className="text-sm text-ink-muted">Sign in to view this workspace.</p></main>;
  if (workspaceQuery.isError) return <main><p role="alert" className="text-sm text-danger">Could not verify workspace membership. Refresh and try again.</p></main>;
  if (!workspace) return <main className="space-y-3"><h1 className="workspace-heading">Workspace unavailable</h1><p role="alert" className="text-sm text-ink-muted">This workspace is unavailable or you no longer belong to it.</p></main>;

  return (
    <main className="space-y-8">
      <div className="workspace-intro">
        <p className="workspace-kicker">Workspaces / Shared review</p>
        <h1 className="workspace-heading">{workspace.name} audits</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">Shared audit history for current workspace members. Workspace Watchtower, exports, and scheduled audits are not available here.</p>
      </div>
      {canCreate && !unavailable && <form onSubmit={submit} className="max-w-3xl space-y-3 rounded-[10px] border border-line bg-canvas-elevated p-5">
        <h2 className="text-lg font-semibold text-ink">Start a shared IaC audit</h2>
        <label htmlFor="workspace-audit-content" className="block text-sm font-medium text-ink">Infrastructure configuration</label>
        <TextArea id="workspace-audit-content" className="min-h-32" value={content} onChange={(event) => setContent(event.target.value)} required placeholder={'resource "aws_security_group" "web" {}'} />
        <p className="text-xs text-ink-muted">Queued for Security and Reliability specialists.</p>
        <Button type="submit" disabled={!content.trim() || create.isPending}>{create.isPending ? "Queueing…" : "Queue shared audit"}</Button>
        {create.isError && <p role="alert" className="text-sm text-danger">{create.error.message}</p>}
      </form>}
      {unavailable ? <p role="alert" className="text-sm text-ink-muted">Shared audits are unavailable. Confirm the feature is enabled and that you still belong to this workspace.</p> : (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-ink">Shared audit history</h2>
          {audits.isPending && <p role="status" className="text-sm text-ink-muted">Loading shared audits…</p>}
          {audits.isError && !unavailable && <div role="alert" className="space-y-2 text-sm text-danger"><p>{audits.error.message}</p><Button variant="secondary" onClick={() => void audits.refetch()}>Retry</Button></div>}
          {audits.data?.length === 0 && <p className="text-sm text-ink-muted">No shared audits are available yet.</p>}
          <ul className="divide-y divide-line">
            {audits.data?.map((audit) => <li key={audit.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div><p className="font-mono text-xs uppercase tracking-wide text-ink-muted">{audit.status}</p><p className="mt-1 text-sm text-ink">{audit.summary ?? "Waiting for specialist results"}</p><p className="mt-1 text-xs text-ink-muted">{audit.specialists.join(" · ")}{audit.partial ? " · Partial results" : ""} · {new Date(audit.createdAt).toLocaleString()}</p></div>
              <div className="flex gap-2"><Button variant="secondary" onClick={() => setSelectedAuditId(audit.id)}>Details</Button>{canManage && <Button variant="secondary" disabled={remove.isPending || audit.status === "queued" || audit.status === "running"} onClick={() => remove.mutate(audit.id)}>Delete</Button>}</div>
            </li>)}
          </ul>
          {Object.entries(deleteStates).map(([auditId, state]) => <div key={auditId} className="flex flex-wrap items-center gap-3 rounded-[10px] border border-line p-3 text-sm" role="status"><span>Deletion {state} for audit {auditId.slice(0, 8)}.</span>{canManage && <Button variant="secondary" disabled={remove.isPending} onClick={() => remove.mutate(auditId)}>Retry deletion</Button>}</div>)}
          {remove.isError && <p role="alert" className="text-sm text-danger">{remove.error.message}</p>}
        </section>
      )}
      {selectedAuditId && !unavailable && <AuditDetail detail={detail} canManage={canManage} onPurge={() => purge.mutate(selectedAuditId)} purgePending={purge.isPending} purgeError={purge.error?.message} onClose={() => setSelectedAuditId(null)} />}
    </main>
  );
}

function AuditDetail({ detail, canManage, onPurge, purgePending, purgeError, onClose }: {
  detail: { data?: WorkspaceAuditDetail; isPending: boolean; isError: boolean; error: Error | null };
  canManage: boolean;
  onPurge: () => void;
  purgePending: boolean;
  purgeError?: string;
  onClose: () => void;
}) {
  if (detail.isPending) return <section aria-live="polite"><p role="status" className="text-sm text-ink-muted">Loading audit details…</p></section>;
  if (detail.isError || !detail.data) return <section className="rounded-[10px] border border-line p-4"><p role="alert" className="text-sm text-danger">{detail.error?.message ?? "Audit details are unavailable."}</p><Button className="mt-3" variant="secondary" onClick={onClose}>Close details</Button></section>;
  const audit = detail.data;
  return <section aria-labelledby="shared-audit-detail" className="space-y-4 rounded-[10px] border border-line bg-canvas-elevated p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="shared-audit-detail" className="text-lg font-semibold text-ink">Audit details</h2><p className="mt-1 text-sm text-ink-muted">{audit.status} · {new Date(audit.createdAt).toLocaleString()}</p></div><Button variant="secondary" onClick={onClose}>Close details</Button></div>
    {audit.summary && <p className="text-sm text-ink">{audit.summary}</p>}{audit.error && <p className="text-sm text-danger">{audit.error}</p>}
    <p className="text-sm text-ink-muted">Source {audit.retention?.inputAvailable ? "is available" : "is unavailable or purged"}. Purge status: {audit.retention?.inputPurgeStatus ?? "unknown"}.</p>
    {canManage && audit.retention?.inputAvailable && <div><Button variant="secondary" disabled={purgePending || audit.status === "queued" || audit.status === "running"} onClick={onPurge}>{purgePending ? "Requesting purge…" : audit.retention.inputPurgeStatus === "pending" || audit.retention.inputPurgeStatus === "failed" ? "Retry source purge" : "Purge source"}</Button>{purgeError && <p role="alert" className="mt-2 text-sm text-danger">{purgeError}</p>}</div>}
    {audit.findings?.length ? <div className="space-y-3"><h3 className="font-semibold text-ink">Findings</h3><ul className="space-y-3">{audit.findings.map((finding, index) => <li key={finding.id ?? `${finding.title}-${index}`} className="rounded-[10px] border border-line p-3"><p className="text-sm font-semibold text-ink">{finding.severity.toUpperCase()} · {finding.title}</p><p className="mt-1 text-sm text-ink-muted">{finding.detail}</p><p className="mt-2 text-xs text-ink-muted">{finding.resource} · {finding.specialist}</p></li>)}</ul></div> : <p className="text-sm text-ink-muted">No findings are available yet.</p>}
    {audit.steps?.length ? <div><h3 className="font-semibold text-ink">Audit activity</h3><ul className="mt-2 space-y-2">{audit.steps.map((step) => <li key={step.stepId} className="text-sm text-ink-muted">{step.agent}: {step.message}</li>)}</ul></div> : null}
  </section>;
}
