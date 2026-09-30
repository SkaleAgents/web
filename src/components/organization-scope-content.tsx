"use client";

import { useOrganizationScope } from "./organization-scope";

export function OrganizationScopeContent({ personal, team }: { personal: React.ReactNode; team?: React.ReactNode }) {
  const { organization } = useOrganizationScope();
  return organization.kind === "personal" ? personal : team ?? <main role="alert">This page is available only in Personal.</main>;
}
