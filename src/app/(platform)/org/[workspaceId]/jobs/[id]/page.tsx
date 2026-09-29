import { PersonalJobDetail } from "@/components/personal-job-detail";
import { OrganizationScopeContent } from "@/components/organization-scope-content";

export default async function OrganizationJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrganizationScopeContent personal={<PersonalJobDetail id={id} />} />;
}
