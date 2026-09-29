import { OrganizationSettings } from "@/components/organization-pages";
import { OrganizationScopeContent } from "@/components/organization-scope-content";
import { AccountSettingsRedirect } from "@/components/account-settings-redirect";

export default async function OrganizationSettingsPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  return <OrganizationScopeContent personal={<AccountSettingsRedirect />} team={<OrganizationSettings workspaceId={workspaceId} />} />;
}
