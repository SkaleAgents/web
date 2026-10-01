import { PersonalScheduleDetail } from "@/components/personal-schedule-detail";

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PersonalScheduleDetail id={id} />;
}
