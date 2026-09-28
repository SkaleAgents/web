"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, LinkButton } from "@/components/ui";
import { apiFetch, ensureCsrfCookie, type WorkspaceRetentionPolicy } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";

export function WorkspaceRetentionNoticeView({ workspaceId }: { workspaceId: string }) {
  const user = useQuery(currentUserOptions);

  return (
    <main className="space-y-8">
      <div className="workspace-intro">
        <p className="workspace-kicker">Organization / Retention</p>
        <h1 className="workspace-heading">Organization audit retention</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          This notice belongs to the organization owner. Your personal audit notice is separate.
        </p>
      </div>
      {user.isPending ? <p role="status" className="text-sm text-ink-muted">Checking your account…</p>
        : user.isError ? <p role="alert" className="text-sm text-danger">Could not load your account. Refresh the page and try again.</p>
          : user.data ? <NoticeContent key={user.data.id} accountId={user.data.id} workspaceId={workspaceId} />
            : <LinkButton href="/login">Sign in to view the organization notice</LinkButton>}
      <LinkButton href="/dashboard/workspaces" variant="secondary">Back to organizations</LinkButton>
    </main>
  );
}

function NoticeContent({ accountId, workspaceId }: { accountId: string; workspaceId: string }) {
  const client = useQueryClient();
  const queryKey = ["workspace-retention", accountId, workspaceId];
  const policy = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const response = await apiFetch<WorkspaceRetentionPolicy>(`/api/workspaces/${workspaceId}/retention`, { signal });
      if (response.workspaceId !== workspaceId || client.getQueryData(currentUserOptions.queryKey)?.id !== accountId) {
        throw new Error("Your account or organization changed. Reload the notice.");
      }
      return response;
    },
  });
  const acknowledge = useMutation({
    mutationFn: async () => {
      if (!policy.data?.noticeToken || !policy.data.acknowledgementEnabled) throw new Error("Reload the notice before recording it.");
      await ensureCsrfCookie();
      return apiFetch<WorkspaceRetentionPolicy>(`/api/workspaces/${workspaceId}/retention/acknowledge`, {
        method: "POST",
        body: JSON.stringify({ workspaceId, noticeToken: policy.data.noticeToken }),
      });
    },
    onSuccess: (response) => {
      if (response.workspaceId !== workspaceId || client.getQueryData(currentUserOptions.queryKey)?.id !== accountId) {
        void client.invalidateQueries({ queryKey });
        return;
      }
      client.setQueryData(queryKey, response);
    },
  });

  if (policy.isPending) return <p role="status" className="text-sm text-ink-muted">Loading organization notice…</p>;
  if (policy.isError) return <div role="alert" className="space-y-3 text-sm text-danger">
    <p>{policy.error.message}</p>
    <Button variant="secondary" onClick={() => void policy.refetch()}>Reload notice</Button>
  </div>;

  return (
    <section className="max-w-3xl space-y-5 rounded-[10px] border border-line bg-canvas-elevated p-5" aria-label="Organization retention notice">
      <div>
        <h2 className="text-lg font-semibold text-ink">What this notice covers</h2>
        <p className="mt-2 text-sm text-ink-muted">Automatic organization audit cleanup is off. Reading or recording this notice does not turn it on.</p>
      </div>
      <ol className="list-decimal space-y-3 pl-5 text-sm text-ink-muted">
        {policy.data.notice.map((line) => <li key={line}>{line}</li>)}
      </ol>
      {policy.data.noticeArchived ? (
        <p role="status" className="text-sm text-ink">
          Notice recorded {new Date(policy.data.noticeDeliveredAt!).toLocaleString()}. Existing organization records cannot be automatically cleaned up before {new Date(policy.data.legacyNotBefore!).toLocaleString()}. Cleanup is still off.
        </p>
      ) : !policy.data.acknowledgementEnabled ? (
        <p role="status" className="text-sm text-ink-muted">Notice recording is not available yet. Organization audits have no automatic cleanup deadline.</p>
      ) : (
        <div className="space-y-3">
          {policy.data.noticeDeliveredAt && <p className="text-sm text-ink-muted">The notice was received, but the archive did not confirm it. Retry with the same notice.</p>}
          <Button disabled={acknowledge.isPending} onClick={() => acknowledge.mutate()}>
            {acknowledge.isPending ? "Recording notice…" : policy.data.noticeDeliveredAt ? "Retry recording" : "Record notice"}
          </Button>
          {acknowledge.isError && <div role="alert" className="space-y-2 text-sm text-danger">
            <p>{acknowledge.error.message}</p>
            <Button variant="secondary" onClick={() => void policy.refetch()}>Reload notice</Button>
          </div>}
        </div>
      )}
    </section>
  );
}
