"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LinkButton } from "@/components/ui";
import { apiFetch, ApiError, ensureCsrfCookie } from "@/lib/api";
import { personalPath } from "@/lib/dashboard-routes";
import { githubErrorMessage, type GithubInstallation } from "@/lib/github";
import { currentUserOptions } from "@/lib/session";

const newAudit = personalPath("jobs/new");

/** GitHub sends the browser here after install: the App's Setup URL must be https://skaleagents.com/github/callback. */
export default function GithubCallbackPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useQuery(currentUserOptions);
  const started = useRef(false);
  const connect = useMutation({
    mutationFn: async () => {
      const query = new URLSearchParams(window.location.search);
      const installationId = query.get("installation_id") ?? "";
      const state = query.get("state");
      const code = query.get("code");
      // The code is single use and secret, so drop it from the address bar and history before anything else.
      window.history.replaceState(null, "", window.location.pathname);
      if (!/^\d+$/.test(installationId) || !state || !code) throw new Error("This link is incomplete. Start again from New audit.");
      await ensureCsrfCookie();
      return apiFetch<GithubInstallation>("/api/github/installation", { method: "POST", body: JSON.stringify({ installationId: Number(installationId), state, code }) });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["github-installation"] });
      router.replace(newAudit);
    },
  });
  useEffect(() => {
    if (user.data && !started.current) { started.current = true; connect.mutate(); }
  }, [user.data, connect]);

  const error = connect.error;
  const message = error instanceof ApiError && error.status === 422
    ? "This GitHub link expired, or your GitHub account does not control that installation. Organization installs need an owner."
    : error ? githubErrorMessage(error) : "";
  return <main className="mx-auto my-12 w-full max-w-md space-y-4 rounded-[10px] border border-line bg-canvas-elevated p-6">
    <h1 className="text-2xl font-semibold">Connecting GitHub</h1>
    {!user.isPending && !user.data && <>
      <p role="alert" className="text-sm text-danger">Sign in to finish connecting GitHub.</p>
      <LinkButton href="/login" variant="secondary">Sign in</LinkButton>
    </>}
    {(user.isPending || connect.isPending || connect.isSuccess) && <p role="status" className="text-sm text-ink-muted">Finishing the connection…</p>}
    {error && <>
      <p role="alert" className="text-sm text-danger">{message}</p>
      <LinkButton href={newAudit}>Try again</LinkButton>
    </>}
  </main>;
}
