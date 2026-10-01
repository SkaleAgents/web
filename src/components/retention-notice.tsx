"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ensureCsrfCookie, type RetentionPolicy } from "@/lib/api";
import { retentionLaterActive, snoozeRetentionNotice, subscribeRetentionLater } from "@/lib/retention-notice-later";
import { currentUserOptions } from "@/lib/session";
import { Button } from "@/components/ui";

export function RetentionNotice({ accountId, presentation = "page" }: { accountId: string; presentation?: "page" | "dialog" }) {
  const client = useQueryClient();
  const queryKey = ["retention-policy", accountId];
  const policy = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const data = await apiFetch<RetentionPolicy>("/api/account/retention", { signal });
      if (data.accountId !== accountId) throw new Error("Your account changed. Reload the policy notice.");
      return data;
    },
    staleTime: 60_000,
  });
  const acknowledge = useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie();
      return apiFetch<RetentionPolicy>("/api/account/retention/acknowledge", {
        method: "POST", body: JSON.stringify({ accountId, noticeToken: policy.data?.noticeToken }),
      });
    },
    onSuccess: (data) => {
      if (data.accountId !== accountId || client.getQueryData(currentUserOptions.queryKey)?.id !== accountId) return;
      client.setQueryData(queryKey, data);
      void client.invalidateQueries({ queryKey: ["swarm-jobs", accountId] });
      void client.invalidateQueries({ queryKey: ["swarm-schedules", accountId] });
    },
  });
  const titleId = useId();
  const onClient = useSyncExternalStore(subscribeRetentionLater, () => true, () => false);
  const laterActive = useSyncExternalStore(subscribeRetentionLater, () => retentionLaterActive(accountId), () => false);
  const acknowledgementOpen = Boolean(policy.data && (policy.data.acknowledgementEnabled ?? policy.data.enabled));
  const awaitingAcceptance = acknowledgementOpen && !policy.data?.noticeArchived;

  if (presentation === "dialog") {
    if (!onClient || laterActive) return null;
    if (!policy.isError && !awaitingAcceptance) return null;
    return (
      <RetentionDialog titleId={titleId}>
        {policy.isError ? (
          <>
            <h2 id={titleId} className="font-semibold">Audit retention policy</h2>
            <RetentionError message={policy.error.message} onReload={() => void policy.refetch()} />
          </>
        ) : policy.data ? (
          <RetentionBody titleId={titleId} policy={policy.data} acknowledge={acknowledge} onReload={() => void policy.refetch()} onLater={() => snoozeRetentionNotice(accountId)} />
        ) : null}
      </RetentionDialog>
    );
  }

  if (policy.isPending) return <p className="text-sm text-ink-muted">Loading retention policy…</p>;
  if (policy.isError) return <RetentionError message={policy.error.message} onReload={() => void policy.refetch()} />;
  if (!acknowledgementOpen && !policy.data.noticeArchived) return <p className="text-sm text-ink-muted">Automatic retention is not active. You can explicitly purge input or delete completed audits and saved schedules.</p>;
  return (
    <section className="space-y-3 rounded-[10px] border border-line p-4" aria-label="Retention policy">
      <RetentionBody titleId={titleId} policy={policy.data} acknowledge={acknowledge} onReload={() => void policy.refetch()} />
    </section>
  );
}

function RetentionDialog({ titleId, children }: { titleId: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node || node.open) return;
    node.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className="retention-notice-dialog m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border border-line bg-canvas-elevated p-6 text-ink shadow-2xl sm:p-8"
      onCancel={(event) => event.preventDefault()}
    >
      {children}
    </dialog>
  );
}

function RetentionBody({ titleId, policy, acknowledge, onReload, onLater }: {
  titleId: string;
  policy: RetentionPolicy;
  acknowledge: { isPending: boolean; isError: boolean; error: Error | null; mutate: () => void };
  onReload: () => void;
  onLater?: () => void;
}) {
  return (
    <div className="space-y-3">
      <h2 id={titleId} className="font-semibold">Audit retention policy</h2>
      {!policy.enabled && <p className="text-sm text-ink-muted">Automatic retention is not active. Recording this notice starts your 30-day legacy grace period but does not activate cleanup.</p>}
      <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">{policy.notice.map(line => <li key={line}>{line}</li>)}</ul>
      {policy.noticeArchived ? <p role="status" className="text-sm">Notice recorded {new Date(policy.noticeDeliveredAt!).toLocaleString()}. Existing records cannot be automatically removed before {new Date(policy.legacyNotBefore!).toLocaleString()}. {policy.enabled ? "Each record shows its effective deadline." : "Deadlines will appear after activation."}</p>
        : <div className="flex flex-wrap gap-2">
          <Button disabled={acknowledge.isPending} onClick={() => acknowledge.mutate()}>{acknowledge.isPending ? "Recording notice…" : "I've read this retention policy"}</Button>
          {onLater ? <Button type="button" variant="secondary" onClick={onLater}>Do it later</Button> : null}
        </div>}
      {onLater ? <p className="text-sm text-ink-muted">Do it later hides this reminder. It lasts 24 hours after you accept cookies, and until you close this browser before that. It does not record that you read the policy.</p> : null}
      {acknowledge.isError && <RetentionError message={acknowledge.error?.message ?? "Could not record the notice."} onReload={onReload} />}
    </div>
  );
}

function RetentionError({ message, onReload }: { message: string; onReload: () => void }) {
  return <div className="space-y-2 text-sm" role="alert"><p>{message}</p><Button variant="secondary" onClick={onReload}>Reload retention policy</Button></div>;
}
