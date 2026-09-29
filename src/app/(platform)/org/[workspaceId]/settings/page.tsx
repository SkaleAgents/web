import { OrganizationSettings } from "@/components/organization-pages";

export default async function OrganizationSettingsPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  return <OrganizationSettings workspaceId={workspaceId} />;
}
