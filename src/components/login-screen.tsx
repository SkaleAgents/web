"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { EmailSignIn } from "@/components/email-sign-in";
import { SignInOptions } from "@/components/sign-in-options";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { currentUserOptions } from "@/lib/session";
import { API_URL, apiFetch } from "@/lib/api";
import { dashboardDestination, personalOrganizationId } from "@/lib/dashboard-routes";
import type { OrganizationMembership } from "@/components/organization-switcher";
import { hasWorkspaceInvitation, WORKSPACE_INVITATION_PATH } from "@/lib/workspace-invitations";
import { Button } from "@/components/ui";

export function LoginScreen({ reauthenticate = false, oauth = false, finishConnect = false, email = false, signup = false }: { reauthenticate?: boolean; oauth?: boolean; finishConnect?: boolean; email?: boolean; signup?: boolean }) {
  const basePath = reauthenticate ? "/auth/reauth" : signup ? "/signup" : "/login";
  const user = useQuery(currentUserOptions);
  const memberships = useQuery({
    queryKey: ["workspaces", user.data?.id ?? "guest"],
    enabled: Boolean(user.data?.id && !user.data.agreementRequired && !reauthenticate),
    queryFn: async ({ signal }) => (await apiFetch<{ data: OrganizationMembership[] }>("/api/workspaces", { signal })).data,
  });
  const router = useRouter();
  useEffect(() => {
    if (!user.data || user.isError || reauthenticate || finishConnect) return;
    const params = new URLSearchParams(window.location.search);
    if (user.data.agreementRequired) {
      const next = params.get("next");
      router.replace(`/auth/agreements${params.get("oauth") === "1" ? "?oauth=1" : next ? `?next=${encodeURIComponent(next)}` : ""}`);
      return;
    }
    if (params.get("oauth") === "1") {
      window.location.replace(`${API_URL}/oauth/authorize`);
    } else if (hasWorkspaceInvitation()) {
      router.replace(WORKSPACE_INVITATION_PATH);
    } else if (memberships.data) {
      const personalId = personalOrganizationId(memberships.data);
      if (personalId) router.replace(dashboardDestination(params.get("next"), personalId, memberships.data));
    }
  }, [router, user.data, user.isError, reauthenticate, finishConnect, memberships.data]);
  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    const error = current.get("error");
    if (!error) return;

    const provider = error.startsWith("github") ? "GitHub" : "Google";
    toast.error(
      error === "invalid_state"
        ? "Your sign-in expired. Please try again."
        : error.endsWith("not_configured")
          ? `${provider} sign-in isn't available yet. Try another option.`
          : `${provider} sign-in failed. If this email already has an account, sign in the way you did before.`,
    );
    const next = new URLSearchParams();
    if (current.get("oauth") === "1") next.set("oauth", "1");
    if (current.get("finish") === "1") next.set("finish", "1");
    const query = next.toString();
    window.history.replaceState({}, "", query ? `${basePath}?${query}` : basePath);
  }, [basePath]);

  if (user.isError) return <main className="mx-auto space-y-4 px-6 py-16" role="alert"><h1 className="text-xl font-semibold">Could not check your session</h1><Button onClick={() => void user.refetch()}>Try again</Button></main>;
  if (user.data && memberships.isError) return <main className="mx-auto space-y-4 px-6 py-16" role="alert"><h1 className="text-xl font-semibold">Could not find your organization</h1><Button onClick={() => void memberships.refetch()}>Try again</Button></main>;
  if (user.isPending || (user.data && !reauthenticate && !finishConnect)) return <main className="px-6 py-16 text-center text-sm text-ink-muted" role="status">{user.data ? "Opening your dashboard…" : "Checking your session…"}</main>;

  return (
    <main className="flex flex-1 items-center justify-center py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="mb-7">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{oauth ? "Connect your editor" : signup ? "Create your SkaleAgents account" : "Sign in to your control plane"}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {oauth
              ? `${signup ? "Create an account" : "Sign in"}, then you return to allow the MCP connection.`
              : signup ? "Start free. Run audits, build bots, and connect your editor." : "Manage your audits, bots, and account in your dashboard."}
          </p>
          {finishConnect && <p className="mt-3 text-sm leading-relaxed text-ink-muted">Finish connecting from the sign-in page.</p>}
        </div>
        <div className="space-y-5 rounded-xl border border-line bg-canvas-elevated p-6 sm:p-8">
          {email ? <>
            <EmailSignIn oauth={oauth} signup={signup} />
            <Link className="block border-t border-line pt-4 text-center text-sm text-ink-muted hover:text-ink" href={`${basePath}${oauth ? "?oauth=1" : ""}`}>{signup ? "← All sign-up options" : "← All sign-in options"}</Link>
          </> : <SignInOptions oauth={oauth} emailPath={`${basePath}/email`} signup={signup} switchable={!reauthenticate} />}
        </div>
      </div>
    </main>
  );
}
