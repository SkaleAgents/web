"use client";

import { useEffect, useId, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ensureCsrfCookie, type RetentionPolicy, type WorkspaceRetentionPolicy } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { Button } from "@/components/ui";

type Policy = RetentionPolicy | WorkspaceRetentionPolicy;
function requiresAcknowledgement(policy: Policy) {
  const enabled = policy.acknowledgementEnabled ?? ("enabled" in policy && policy.enabled);
  return enabled && !policy.noticeArchived;
}

export function RequiredRetentionNotice({ accountId, workspaceId }: { accountId: string; workspaceId?: string }) {
  return <Notice key={accountId} accountId={accountId} nextWorkspaceId={workspaceId} />;
}

function Notice({ accountId, workspaceId, nextWorkspaceId }: { accountId: string; workspaceId?: string; nextWorkspaceId?: string }) {
  const client = useQueryClient();
  const queryKey = workspaceId ? ["workspace-retention", accountId, workspaceId] : ["retention-policy", accountId];
  const endpoint = workspaceId ? `/api/workspaces/${workspaceId}/retention` : "/api/account/retention";
  function verify(data: Policy) {
    if (client.getQueryData(currentUserOptions.queryKey)?.id !== accountId ||
      (workspaceId ? !("workspaceId" in data) || data.workspaceId !== workspaceId : !("accountId" in data) || data.accountId !== accountId)) {
      throw new Error("Your account or organization changed. Reload the notice.");
    }
    return data;
  }
  const policy = useQuery({
    queryKey,
    queryFn: async ({ signal }) => verify(await apiFetch<Policy>(endpoint, { signal })),
    staleTime: 60_000,
  });
  const acknowledge = useMutation({
    mutationFn: async () => {
      if (!policy.data?.noticeToken || !requiresAcknowledgement(policy.data)) throw new Error("Reload the notice before acknowledging it.");
      const version = policy.data.version;
      await ensureCsrfCookie();
      const data = verify(await apiFetch<Policy>(`${endpoint}/acknowledge`, {
        method: "POST",
        body: JSON.stringify(workspaceId ? { workspaceId, noticeToken: policy.data.noticeToken } : { accountId, noticeToken: policy.data.noticeToken }),
      }));
      if (!data.noticeArchived || data.version !== version) throw new Error("Your acknowledgement was not confirmed. Please try again.");
      return data;
    },
    onSuccess: data => {
      if (client.getQueryData(currentUserOptions.queryKey)?.id !== accountId) return;
      client.setQueryData(queryKey, data);
      void client.invalidateQueries({ queryKey: ["swarm-jobs", accountId] });
      void client.invalidateQueries({ queryKey: ["swarm-schedules", accountId] });
    },
  });

  if (!policy.data) return policy.isError && nextWorkspaceId
    ? <Notice key={nextWorkspaceId} accountId={accountId} workspaceId={nextWorkspaceId} /> : null;
  if (!requiresAcknowledgement(policy.data)) return nextWorkspaceId
    ? <Notice key={nextWorkspaceId} accountId={accountId} workspaceId={nextWorkspaceId} /> : null;
  const active = "enabled" in policy.data ? policy.data.enabled : policy.data.automaticRetentionEnabled;
  return <AcknowledgementDialog title={workspaceId ? "Organization audit retention" : "Audit retention policy"}>
    <p className="text-sm text-ink-muted">Please read and acknowledge this policy to continue to your dashboard.</p>
    <ul className="list-disc space-y-3 pl-5 text-sm text-ink">{policy.data.notice.map(line => <li key={line}>{line}</li>)}</ul>
    {!active && <p className="rounded-lg bg-canvas p-3 text-sm text-ink-muted">Automatic retention is not active. Acknowledging this notice starts your 30-day legacy grace period but does not activate cleanup.</p>}
    {acknowledge.isError && <div role="alert" className="space-y-2 text-sm text-danger">
      <p>{acknowledge.error.message}</p>
      <Button variant="secondary" onClick={() => void policy.refetch()}>Reload notice</Button>
    </div>}
    <Button disabled={acknowledge.isPending} onClick={() => acknowledge.mutate()}>{acknowledge.isPending ? "Saving acknowledgement…" : "I acknowledge"}</Button>
  </AcknowledgementDialog>;
}

function AcknowledgementDialog({ title, children }: { title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} aria-labelledby={titleId} aria-modal="true" onCancel={event => event.preventDefault()}
    onKeyDown={event => {
      if (event.key === "Escape") event.stopPropagation();
      if (event.key !== "Tab") return;
      const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
      const first = buttons[0];
      const last = buttons.at(-1);
      if (!first || !last) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !buttons.includes(document.activeElement as HTMLButtonElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }}
    className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border border-line bg-canvas-elevated p-6 text-ink shadow-2xl backdrop:bg-black/60 sm:p-8">
    <div className="space-y-5">
      <h2 id={titleId} tabIndex={-1} autoFocus className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </div>
  </dialog>;
}
