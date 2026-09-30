"use client";

import { DashboardPageLoader } from "@/components/dashboard-page-loader";

import { useOrganizationRoot } from "./organization-scope";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { OrganizationSettingsManager } from "@/components/organization-settings-manager";

type Organization = { id: string; name: string; role: "owner" | "member" | "viewer" };

function useOrganization(workspaceId: string) {
  const account = useQuery(currentUserOptions);
  const client = useQueryClient();
  const accountId = account.data?.id;
  const organization = useQuery({
    queryKey: ["organization", accountId ?? "guest", workspaceId],
    enabled: Boolean(accountId),
    queryFn: async ({ signal }) => {
      const response = await apiFetch<{ data: Organization }>(`/api/workspaces/${workspaceId}`, { signal });
      if (response.data.id !== workspaceId || client.getQueryData(currentUserOptions.queryKey)?.id !== accountId) {
        throw new Error("The organization or account changed. Reload this page.");
      }
      return response.data;
    },
  });
  return { account, organization };
}

function OrganizationGate({ workspaceId, children }: { workspaceId: string; children: (organization: Organization, accountId: string) => React.ReactNode }) {
  const { account, organization } = useOrganization(workspaceId);
  if (account.isPending || organization.isPending) return <DashboardPageLoader />;
  if (account.isError || !account.data || organization.isError || !organization.data) return <main role="alert">Organization unavailable.</main>;
  return children(organization.data, account.data.id);
}

export function OrganizationOverview({ workspaceId }: { workspaceId: string }) {
  const root = useOrganizationRoot(workspaceId);
  return <OrganizationGate workspaceId={workspaceId}>{organization => <main className="space-y-7">
    <div className="workspace-intro">
      <p className="workspace-kicker">Organization overview</p>
      <h1 className="workspace-heading">{organization.name}</h1>
      <p className="mt-2 text-sm text-ink-muted">Work created here belongs to this organization. Your personal work stays in Personal.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <Link className="rounded-lg border border-line bg-canvas-elevated p-5 hover:bg-canvas" href={`${root}/jobs`}>
        <h2 className="font-semibold">Audit jobs</h2><p className="mt-1 text-sm text-ink-muted">Review shared audit history and start a new audit.</p>
      </Link>
      <Link className="rounded-lg border border-line bg-canvas-elevated p-5 hover:bg-canvas" href={`${root}/schedules`}>
        <h2 className="font-semibold">Scheduled audits</h2><p className="mt-1 text-sm text-ink-muted">Manage recurring organization reviews.</p>
      </Link>
      <Link className="rounded-lg border border-line bg-canvas-elevated p-5 hover:bg-canvas" href={`${root}/settings`}>
        <h2 className="font-semibold">Organization settings</h2><p className="mt-1 text-sm text-ink-muted">View access and retention controls.</p>
      </Link>
      {organization.role === "owner" && <Link className="rounded-lg border border-line bg-canvas-elevated p-5 hover:bg-canvas" href={`${root}/billing`}>
        <h2 className="font-semibold">Billing</h2><p className="mt-1 text-sm text-ink-muted">View the organization plan and audit usage.</p>
      </Link>}
    </div>
  </main>}</OrganizationGate>;
}

export function OrganizationSettings({ workspaceId }: { workspaceId: string }) {
  const root = useOrganizationRoot(workspaceId);
  return <OrganizationGate workspaceId={workspaceId}>{(organization, accountId) => <main className="space-y-7">
    <div className="workspace-intro">
      <p className="workspace-kicker">Organization / Settings</p>
      <h1 className="workspace-heading">Organization settings</h1>
    </div>
    <OrganizationSettingsManager key={`${accountId}:${workspaceId}`} organization={organization} accountId={accountId} />
    {organization.role === "owner" && <Link href={`${root}/settings/retention`} className="inline-flex text-sm font-semibold text-accent underline underline-offset-4">
      Audit retention notice
    </Link>}
  </main>}</OrganizationGate>;
}
