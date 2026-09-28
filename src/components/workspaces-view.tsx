"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, TextInput } from "@/components/ui";
import { apiFetch, ensureCsrfCookie } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";

type Workspace = {
  id: string;
  name: string;
  createdAt: string;
  role: "owner" | "member" | "viewer";
};

export function WorkspacesView() {
  const user = useQuery(currentUserOptions);

  return (
    <main className="space-y-8">
      <div className="workspace-intro">
        <p className="workspace-kicker">Organizations / Memberships</p>
        <h1 className="workspace-heading">Organizations</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          See the organizations you belong to or create one. Memberships do not change access to your audits, schedules, or advisory requests. Those records remain tied to your account.
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
      <form onSubmit={submit} className="max-w-2xl rounded-[10px] border border-line bg-canvas-elevated p-5">
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
        ) : workspaces.data.length === 0 ? (
          <p className="text-sm text-ink-muted">You do not belong to an organization yet.</p>
        ) : (
          <ul className="grid gap-3">
            {workspaces.data.map((workspace) => (
              <li key={workspace.id} className="rounded-[10px] border border-line bg-canvas-elevated p-4">
                <h3 className="font-semibold text-ink">{workspace.name}</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  {workspace.role} · Created {new Date(workspace.createdAt).toLocaleDateString()}
                </p>
                {workspace.role === "owner" && (
                  <Link href={`/dashboard/workspaces/${workspace.id}/retention`} className="mt-3 inline-block text-sm font-medium text-accent underline underline-offset-4">
                    View audit retention notice
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
