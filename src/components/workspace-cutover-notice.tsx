"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, LinkButton } from "@/components/ui";
import { apiFetch, ensureCsrfCookie, type WorkspaceCutoverNotice } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";

function utcInstant(value: string): string {
  return `${new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(new Date(value))} UTC`;
}

function approvedUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function WorkspaceCutoverNoticeView({ workspaceId }: { workspaceId: string }) {
  const user = useQuery(currentUserOptions);

  return <main className="space-y-8">
    <div className="workspace-intro">
      <p className="workspace-kicker">Organization / Free plan</p>
      <h1 className="workspace-heading">Free organization audit notice</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-muted">This notice belongs to the current organization owner. Your personal audits and MCP access are separate.</p>
    </div>
    {user.isPending ? <p role="status" className="text-sm text-ink-muted">Checking your account…</p>
      : user.isError ? <p role="alert" className="text-sm text-danger">Could not load your account. Refresh the page and try again.</p>
        : user.data ? <NoticeContent key={`${user.data.id}:${workspaceId}`} accountId={user.data.id} workspaceId={workspaceId} />
          : <LinkButton href="/login">Sign in to view the organization notice</LinkButton>}
    <LinkButton href="/me/organizations" variant="secondary">Back to organizations</LinkButton>
  </main>;
}

function NoticeContent({ accountId, workspaceId }: { accountId: string; workspaceId: string }) {
  const client = useQueryClient();
  const queryKey = ["workspace-cutover-notice", accountId, workspaceId];
  const notice = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const response = await apiFetch<WorkspaceCutoverNotice>(`/api/workspaces/${workspaceId}/cutover-notice`, { signal });
      if (response.workspaceId !== workspaceId || client.getQueryData(currentUserOptions.queryKey)?.id !== accountId) {
        throw new Error("Your account or organization changed. Reload the notice.");
      }
      return response;
    },
  });
  const acknowledge = useMutation({
    mutationFn: async () => {
      if (!notice.data?.noticeToken || !notice.data.acknowledgementEnabled) throw new Error("Reload the notice before recording it.");
      await ensureCsrfCookie();
      return apiFetch<WorkspaceCutoverNotice>(`/api/workspaces/${workspaceId}/cutover-notice/acknowledge`, {
        method: "POST", body: JSON.stringify({ workspaceId, noticeToken: notice.data.noticeToken }),
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

  if (notice.isPending) return <p role="status" className="text-sm text-ink-muted">Loading Free plan notice…</p>;
  if (notice.isError) return <div role="alert" className="space-y-3 text-sm text-danger">
    <p>{notice.error.message}</p>
    <Button variant="secondary" onClick={() => void notice.refetch()}>Reload notice</Button>
  </div>;

  return <section className="max-w-3xl space-y-5 rounded-[10px] border border-line bg-canvas-elevated p-5" aria-label="Free organization cutover notice">
    <div>
      <h2 className="text-lg font-semibold text-ink">What will change</h2>
      <p className="mt-2 text-sm text-ink-muted">Planned effective time: {utcInstant(notice.data.effectiveAt)}. Recording this notice does not change your current plan or audit allowance.</p>
    </div>
    <p className="whitespace-pre-line text-sm leading-6 text-ink">{notice.data.body}</p>
    <div className="flex flex-wrap gap-4 text-sm">
      {approvedUrl(notice.data.billingUrl) ? <a className="font-medium text-accent underline underline-offset-4" href={notice.data.billingUrl}>Review plans</a> : null}
      {approvedUrl(notice.data.supportUrl) ? <a className="font-medium text-accent underline underline-offset-4" href={notice.data.supportUrl}>Contact support</a> : null}
    </div>
    {notice.data.acknowledgedAt ? <p role="status" className="text-sm text-ink">Notice recorded {utcInstant(notice.data.acknowledgedAt)}.</p>
      : !notice.data.acknowledgementEnabled ? <p role="status" className="text-sm text-ink-muted">Notice recording is not available yet. Your current access is unchanged.</p>
        : <div className="space-y-3">
          <Button disabled={acknowledge.isPending} onClick={() => acknowledge.mutate()}>
            {acknowledge.isPending ? "Recording notice…" : "Record that I have read this notice"}
          </Button>
          {acknowledge.isError ? <div role="alert" className="space-y-2 text-sm text-danger">
            <p>{acknowledge.error.message}</p>
            <Button variant="secondary" onClick={() => void notice.refetch()}>Reload notice</Button>
          </div> : null}
        </div>}
  </section>;
}
