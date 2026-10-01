import { PersonalScheduleDetail } from "@/components/personal-schedule-detail";
import { OrganizationScopeContent } from "@/components/organization-scope-content";

export default async function OrganizationSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrganizationScopeContent personal={<PersonalScheduleDetail id={id} />} />;
}
