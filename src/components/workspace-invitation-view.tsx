"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useSyncExternalStore } from "react";
import { Button, LinkButton } from "@/components/ui";
import { ApiError, apiFetch, ensureCsrfCookie, googleSignInHref, type NotificationSettings } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import {
  clearWorkspaceInvitation,
  hasWorkspaceInvitation,
  subscribeToWorkspaceInvitation,
  WORKSPACE_INVITATION_TOKEN_KEY,
} from "@/lib/workspace-invitations";

const INVALID_INVITATION = "This invitation is invalid, expired, revoked, already used, or belongs to a different verified email address.";

export function WorkspaceInvitationView() {
  const queryClient = useQueryClient();
  const user = useQuery(currentUserOptions);
  const hasInvitation = useSyncExternalStore(subscribeToWorkspaceInvitation, hasWorkspaceInvitation, () => false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountId = user.data?.id;
  const verification = useQuery({
    queryKey: ["workspace-invitation-account", accountId],
    enabled: Boolean(accountId && hasInvitation),
    retry: false,
    queryFn: async ({ signal }) => {
      const result = await apiFetch<NotificationSettings>("/api/account/notifications", { signal });
      if (result.accountId !== accountId) throw new Error("Your account changed. Reopen the invitation after signing in again.");
      return result;
    },
  });

  async function acceptInvitation() {
    if (!accountId || !verification.data?.emailVerified || submitting) return;
    const token = window.sessionStorage.getItem(WORKSPACE_INVITATION_TOKEN_KEY);
    if (!token) {
      clearWorkspaceInvitation();
      setError("This invitation link is missing its credential. Reopen the link from your invitation email.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await ensureCsrfCookie();
      await apiFetch<{ data: { workspaceId: string; role: "member" | "viewer" } }>("/api/workspace-invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      clearWorkspaceInvitation();
      setAccepted(true);
      await queryClient.invalidateQueries({ queryKey: ["workspaces", accountId] });
    } catch (reason) {
      if (reason instanceof ApiError) {
        clearWorkspaceInvitation();
        setError(reason.status === 422
          ? INVALID_INVITATION
          : reason.status === 409
            ? "This account already has an active membership in the organization."
            : "The invitation could not be accepted. Reopen the original email link and try again.");
      } else {
        setError("Could not reach the invitation service. Try again, or reopen the original email link.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="space-y-8">
      <div className="workspace-intro">
        <p className="workspace-kicker">Organization / Invitation</p>
        <h1 className="workspace-heading">Accept organization invitation</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Join the organization using the verified email address that received the invitation.
        </p>
      </div>

      {!hasInvitation ? (
        <section className="max-w-2xl rounded-[10px] border border-line bg-canvas-elevated p-5">
          {accepted ? (
            <>
              <p role="status" className="text-sm text-ink">Invitation accepted. Your organization membership is active.</p>
              <LinkButton href="/dashboard/workspaces" className="mt-4">View organizations</LinkButton>
            </>
          ) : error ? (
            <p role="alert" className="text-sm text-danger">{error}</p>
          ) : (
            <p role="alert" className="text-sm text-danger">
              This invitation link is missing its credential or has already been used. Reopen the link from your invitation email.
            </p>
          )}
        </section>
      ) : !user.data ? (
        <section className="max-w-2xl rounded-[10px] border border-line bg-canvas-elevated p-5">
          <p className="text-sm text-ink-muted">Sign in with the verified email address that received this invitation. The invitation will resume after sign-in.</p>
          <LinkButton href={googleSignInHref()} className="mt-4">Sign in with Google</LinkButton>
          {user.isError ? <p role="alert" className="mt-3 text-sm text-danger">Could not check your account. Try again.</p> : null}
        </section>
      ) : verification.isError ? (
        <section className="max-w-2xl rounded-[10px] border border-line bg-canvas-elevated p-5">
          <p role="alert" className="text-sm text-danger">Could not verify your account. Try again before accepting the invitation.</p>
          <Button type="button" variant="secondary" className="mt-4" onClick={() => void verification.refetch()}>Retry account check</Button>
        </section>
      ) : verification.isPending ? (
        <p role="status" className="text-sm text-ink-muted">Checking your verified email status…</p>
      ) : !verification.data.emailVerified ? (
        <section className="max-w-2xl rounded-[10px] border border-line bg-canvas-elevated p-5">
          <p role="alert" className="text-sm text-danger">Your account email is not verified. Sign out, sign in with the verified email address that received the invitation, then reopen the email link.</p>
        </section>
      ) : (
        <section className="max-w-2xl rounded-[10px] border border-line bg-canvas-elevated p-5">
          <h2 className="text-lg font-semibold text-ink">Confirm membership</h2>
          <p className="mt-2 text-sm text-ink-muted">Your signed-in account has a verified email address. Accept to join this organization.</p>
          {error ? <p role="alert" className="mt-3 text-sm text-danger">{error}</p> : null}
          <Button type="button" className="mt-4" disabled={submitting} onClick={() => void acceptInvitation()}>
            {submitting ? "Accepting…" : "Accept invitation"}
          </Button>
          <p className="mt-4 text-xs text-ink-muted">Organization membership does not share your personal audits, schedules, or advisory requests.</p>
        </section>
      )}
      <Link href="/dashboard/workspaces" className="text-sm text-ink-muted underline underline-offset-4">View your organizations</Link>
    </main>
  );
}
