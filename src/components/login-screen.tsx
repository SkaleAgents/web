"use client";

import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";
import { EmailSignIn } from "@/components/email-sign-in";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { currentUserOptions } from "@/lib/session";
import { API_URL } from "@/lib/api";
import { dashboardDestination } from "@/lib/dashboard";
import { hasWorkspaceInvitation, WORKSPACE_INVITATION_PATH } from "@/lib/workspace-invitations";
import { Button } from "@/components/ui";

export function LoginScreen({ reauthenticate = false }: { reauthenticate?: boolean }) {
  const user = useQuery(currentUserOptions);
  const router = useRouter();
  useEffect(() => {
    if (!user.data || user.isError || reauthenticate) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth") === "1") {
      window.location.replace(`${API_URL}/oauth/authorize`);
    } else {
      router.replace(hasWorkspaceInvitation() ? WORKSPACE_INVITATION_PATH : dashboardDestination(params.get("next")));
    }
  }, [router, user.data, user.isError, reauthenticate]);
  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (!error) return;

    toast.error(
      error === "invalid_state"
        ? "Your Google sign-in expired. Please try again."
        : "Google sign-in failed. Please try again.",
    );
    window.history.replaceState({}, "", "/login");
  }, []);

  if (user.isError) return <main className="mx-auto space-y-4 px-6 py-16" role="alert"><h1 className="text-xl font-semibold">Could not check your session</h1><Button onClick={() => void user.refetch()}>Try again</Button></main>;
  if (user.isPending || (user.data && !reauthenticate)) return <main className="px-6 py-16 text-center text-sm text-ink-muted" role="status">{user.data ? "Opening your workspace…" : "Checking your session…"}</main>;

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="mb-7">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Sign in to your control plane</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Manage your audits, bots, and account in your dashboard.
          </p>
        </div>
        <div className="space-y-5 rounded-xl border border-line bg-canvas-elevated p-6 sm:p-8">
          <EmailSignIn />
          <details className="border-t border-line pt-5 text-sm text-ink-muted">
            <summary className="cursor-pointer">Connecting an MCP client?</summary>
            <p className="mt-2 leading-relaxed">
              After sign-in, approve the MCP access request and return to
              your MCP client. The client handles credentials automatically.
            </p>
          </details>
        </div>
        <p className="mt-6 text-center text-sm text-ink-muted">
          Prefer to look around first?{" "}
          <Link href="/bots" className="font-medium text-ink underline-offset-4 hover:underline">Browse the directory</Link>
        </p>
      </div>
    </main>
  );
}
