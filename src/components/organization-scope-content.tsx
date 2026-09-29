"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import type { OrganizationMembership } from "@/components/organization-switcher";

export function OrganizationScopeContent({ personal, team }: { personal: React.ReactNode; team?: React.ReactNode }) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const user = useQuery(currentUserOptions);
  const memberships = useQuery({
    queryKey: ["workspaces", user.data?.id ?? "guest"],
    enabled: Boolean(user.data?.id),
    queryFn: async ({ signal }) => (await apiFetch<{ data: OrganizationMembership[] }>("/api/workspaces", { signal })).data,
  });
  if (user.isPending || memberships.isPending) return <main role="status">Checking organization access…</main>;
  const membership = memberships.data?.find(item => item.id === workspaceId);
  if (!user.data || memberships.isError || !membership) return <main role="alert">Organization unavailable.</main>;
  if (membership.kind === "personal") return personal;
  return team ?? <main role="alert">This page is available only in Personal.</main>;
}
