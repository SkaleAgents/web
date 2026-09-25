"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ensureCsrfCookie, type RetentionPolicy } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { Button } from "@/components/ui";

export function RetentionNotice({ accountId }: { accountId: string }) {
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
  if (policy.isPending) return <p className="text-sm text-ink-muted">Loading retention policy…</p>;
  if (policy.isError) return <div className="space-y-2 text-sm" role="alert"><p>{policy.error.message}</p><Button variant="secondary" onClick={() => void policy.refetch()}>Reload retention policy</Button></div>;
  if (!(policy.data.acknowledgementEnabled ?? policy.data.enabled) && !policy.data.noticeArchived) return <p className="text-sm text-ink-muted">Automatic retention is not active. You can explicitly purge input or delete completed audits and saved schedules.</p>;
  return (
    <section className="space-y-3 rounded-[10px] border border-line p-4" aria-label="Retention policy">
      <h2 className="font-semibold">Audit retention policy</h2>
      {!policy.data.enabled && <p className="text-sm text-ink-muted">Automatic retention is not active. Recording this notice starts your 30-day legacy grace period but does not activate cleanup.</p>}
      <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">{policy.data.notice.map(line => <li key={line}>{line}</li>)}</ul>
      {policy.data.noticeArchived ? <p role="status" className="text-sm">Notice recorded {new Date(policy.data.noticeDeliveredAt!).toLocaleString()}. Existing records cannot be automatically removed before {new Date(policy.data.legacyNotBefore!).toLocaleString()}. {policy.data.enabled ? "Each record shows its effective deadline." : "Deadlines will appear after activation."}</p>
        : <Button disabled={acknowledge.isPending} onClick={() => acknowledge.mutate()}>{acknowledge.isPending ? "Recording notice…" : "I've read this retention policy"}</Button>}
      {acknowledge.isError && <div role="alert" className="space-y-2 text-sm text-danger"><p>{acknowledge.error.message}</p><Button variant="secondary" onClick={() => void policy.refetch()}>Reload retention policy</Button></div>}
    </section>
  );
}
