import { OrganizationOverview } from "@/components/organization-pages";
import PersonalOverview from "@/app/(platform)/dashboard/page";
import { OrganizationScopeContent } from "@/components/organization-scope-content";

export default async function OrganizationPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  return <OrganizationScopeContent personal={<PersonalOverview />} team={<OrganizationOverview workspaceId={workspaceId} />} />;
}
