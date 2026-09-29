import { OrganizationOverview } from "@/components/organization-pages";

export default async function OrganizationPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  return <OrganizationOverview workspaceId={workspaceId} />;
}
