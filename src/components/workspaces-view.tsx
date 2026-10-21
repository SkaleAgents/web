"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { organizationHref } from "@/lib/dashboard-routes";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button, TextInput } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { apiFetch, ensureCsrfCookie } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { workspaceAuditsEnabled } from "@/lib/workspace-audits";

type Workspace = {
  id: string;
  slug?: string | null;
  name: string;
  createdAt: string;
  role: "owner" | "member" | "viewer";
  kind: "personal" | "team";
  cutoverNoticeAvailable?: boolean;
};

export function WorkspacesView() {
  const user = useQuery(currentUserOptions);

  return (
    <main className="space-y-8">
      <div className="workspace-intro">
        <p className="workspace-kicker">Organizations / Memberships</p>
        <h1 className="workspace-heading">Organizations</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          See the organizations you belong to or create one. Your personal audits and schedules remain tied to your account.
        </p>
      </div>

      {user.isError ? (
        <p role="alert" className="text-sm text-danger">Could not load your account. Refresh the page and try again.</p>
      ) : user.isPending ? (
        <p role="status" className="text-sm text-ink-muted">Checking your account…</p>
      ) : user.data ? (
        <WorkspaceManager key={user.data.id} accountId={user.data.id} />
      ) : (
        <p className="text-sm text-ink-muted">Use Google sign-in in the header to view or create organizations.</p>
      )}
    </main>
  );
}

function WorkspaceManager({ accountId }: { accountId: string }) {
  const queryClient = useQueryClient();
  const queryKey = ["workspaces", accountId];
  const [name, setName] = useState("");
  const workspaces = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const response = await apiFetch<{ data: Workspace[] }>("/api/workspaces", { signal });
      if (queryClient.getQueryData(currentUserOptions.queryKey)?.id !== accountId) {
        throw new Error("Your account changed. Reload organizations before continuing.");
      }
      return response.data;
    },
  });
  const create = useMutation({
    mutationFn: async () => {
      const workspaceName = name.trim();
      if (!workspaceName) throw new Error("Enter an organization name.");
      await ensureCsrfCookie();
      const response = await apiFetch<{ data: Workspace }>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: workspaceName }),
      });
      return response.data;
    },
    onSuccess: async (workspace) => {
      if (queryClient.getQueryData(currentUserOptions.queryKey)?.id !== accountId) return;
      setName("");
      queryClient.setQueryData<Workspace[]>(queryKey, (current) => [workspace, ...(current ?? [])]);
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    create.mutate();
  }

  return (
    <div className="space-y-8">
      <form id="create-organization" onSubmit={submit} className="max-w-2xl scroll-mt-24 rounded-[10px] border border-line bg-canvas-elevated p-5">
        <h2 className="text-lg font-semibold text-ink">Create an organization</h2>
        <label htmlFor="workspace-name" className="mt-4 block text-sm font-medium text-ink">Organization name</label>
        <TextInput
          id="workspace-name"
          className="mt-2"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={120}
          autoComplete="organization"
          required
        />
        <Button type="submit" disabled={create.isPending || !name.trim()} className="mt-4">
          {create.isPending ? "Creating…" : "Create organization"}
        </Button>
        {create.isError ? <p role="alert" className="mt-3 text-sm text-danger">{create.error.message}</p> : null}
      </form>

      <section aria-labelledby="workspace-memberships-heading" className="space-y-4">
        <h2 id="workspace-memberships-heading" className="text-lg font-semibold text-ink">Your memberships</h2>
        {workspaces.isError ? (
          <div role="alert" className="space-y-3 text-sm text-danger">
            <p>{workspaces.error.message}</p>
            <Button type="button" variant="secondary" onClick={() => void workspaces.refetch()}>Retry</Button>
          </div>
        ) : workspaces.isPending ? (
          <p role="status" className="text-sm text-ink-muted">Loading memberships…</p>
        ) : workspaces.data.filter(workspace => workspace.kind === "team").length === 0 ? (
          <p className="text-sm text-ink-muted">You do not belong to an organization yet.</p>
        ) : (
          <ul className="grid gap-3">
            {workspaces.data.filter(workspace => workspace.kind === "team").map((workspace) => (
              <li key={workspace.id} className="rounded-[10px] border border-line bg-canvas-elevated p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={workspace.name} kind="team" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-ink"><Link href={organizationHref(workspace)} className="hover:underline">{workspace.name}</Link></h3>
                    <p className="text-sm text-ink-muted">
                      <span className="capitalize">{workspace.role}</span>{workspace.createdAt && ` · Created ${new Date(workspace.createdAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                {(workspace.role === "owner" || workspaceAuditsEnabled()) && (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                    {workspace.role === "owner" && (
                      <Link href={organizationHref(workspace, "settings/retention")} className="text-sm font-medium text-accent underline underline-offset-4">
                        View audit retention notice
                      </Link>
                    )}
                    {workspace.role === "owner" && workspace.cutoverNoticeAvailable && (
                      <Link href={organizationHref(workspace, "settings/cutover-notice")} className="text-sm font-medium text-accent underline underline-offset-4">
                        Review Free plan notice
                      </Link>
                    )}
                    {workspaceAuditsEnabled() && (
                      <Link className="text-sm font-semibold text-accent underline-offset-4 hover:underline" href={organizationHref(workspace, "jobs")}>
                        Shared audits
                      </Link>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
