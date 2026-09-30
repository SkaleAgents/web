"use client";

import { useOrganizationScope } from "./organization-scope";
import { OrganizationOverview, OrganizationSettings } from "./organization-pages";
import { OrganizationBillingView } from "./organization-billing-view";
import { WorkspaceRetentionNoticeView } from "./workspace-retention-notice";
import { WorkspaceCutoverNoticeView } from "./workspace-cutover-notice";

export function ScopedOrganizationOverview() {
  const { organization } = useOrganizationScope();
  return <OrganizationOverview workspaceId={organization.id} />;
}
export function ScopedOrganizationSettings() {
  const { organization } = useOrganizationScope();
  return <OrganizationSettings workspaceId={organization.id} />;
}
export function ScopedOrganizationBilling({ checkoutReturn }: { checkoutReturn: boolean }) {
  const { organization } = useOrganizationScope();
  return <OrganizationBillingView organizationId={organization.id} checkoutReturnOrganizationId={checkoutReturn ? organization.id : null} />;
}
export function ScopedOrganizationRetention() {
  const { organization } = useOrganizationScope();
  return <WorkspaceRetentionNoticeView workspaceId={organization.id} />;
}
export function ScopedOrganizationCutover() {
  const { organization } = useOrganizationScope();
  return <WorkspaceCutoverNoticeView workspaceId={organization.id} />;
}
