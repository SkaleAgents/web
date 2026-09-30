"use client";

import { createContext, useContext } from "react";
import type { OrganizationMembership } from "./organization-switcher";
import { organizationPath } from "@/lib/dashboard-routes";

export type ResolvedOrganizationScope = { organization: OrganizationMembership; root: string };
export const OrganizationScopeContext = createContext<ResolvedOrganizationScope | null>(null);

export function useOrganizationScope(): ResolvedOrganizationScope {
  const scope = useContext(OrganizationScopeContext);
  if (!scope) throw new Error("Organization scope must be resolved before loading this page.");
  return scope;
}

export function useOrganizationRoot(fallbackId: string | undefined): string {
  const scope = useContext(OrganizationScopeContext);
  return scope && scope.organization.id === fallbackId ? scope.root : fallbackId ? organizationPath(fallbackId) : "/me/organizations";
}
