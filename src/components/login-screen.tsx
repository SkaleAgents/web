"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { EmailSignIn } from "@/components/email-sign-in";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { currentUserOptions } from "@/lib/session";
import { API_URL, apiFetch } from "@/lib/api";
import { dashboardDestination, personalOrganizationId } from "@/lib/dashboard-routes";
import type { OrganizationMembership } from "@/components/organization-switcher";
import { hasWorkspaceInvitation, WORKSPACE_INVITATION_PATH } from "@/lib/workspace-invitations";
import { Button } from "@/components/ui";

export function LoginScreen({ reauthenticate = false }: { reauthenticate?: boolean }) {
  const user = useQuery(currentUserOptions);
  const memberships = useQuery({
    queryKey: ["workspaces", user.data?.id ?? "guest"],
    enabled: Boolean(user.data?.id && !user.data.agreementRequired && !reauthenticate),
    queryFn: async ({ signal }) => (await apiFetch<{ data: OrganizationMembership[] }>("/api/workspaces", { signal })).data,
  });
  const router = useRouter();
  useEffect(() => {
    if (!user.data || user.isError || reauthenticate) return;
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
  }, [router, user.data, user.isError, reauthenticate, memberships.data]);
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
  if (user.data && memberships.isError) return <main className="mx-auto space-y-4 px-6 py-16" role="alert"><h1 className="text-xl font-semibold">Could not find your organization</h1><Button onClick={() => void memberships.refetch()}>Try again</Button></main>;
  if (user.isPending || (user.data && !reauthenticate)) return <main className="px-6 py-16 text-center text-sm text-ink-muted" role="status">{user.data ? "Opening your dashboard…" : "Checking your session…"}</main>;

  return (
    <main className="flex flex-1 items-center justify-center py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="mb-7">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Sign in to your control plane</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Manage your audits, bots, and account in your dashboard.
          </p>
        </div>
        <div className="space-y-5 rounded-xl border border-line bg-canvas-elevated p-6 sm:p-8">
          <EmailSignIn />
        </div>
      </div>
    </main>
  );
}
