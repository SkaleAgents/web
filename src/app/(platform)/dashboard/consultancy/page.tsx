import { CustomerConsultancyPage } from "@/components/customer-consultancy-page";
import type { ConsultancyBooking } from "@/lib/api";

export default async function ConsultancyPage({ searchParams }: { searchParams: Promise<{ sourceType?: string; sourceId?: string }> }) {
  const { sourceType, sourceId } = await searchParams;
  const source: NonNullable<ConsultancyBooking["source"]> | undefined = (sourceType === "audit_job" || sourceType === "advisory_booking") && sourceId
    ? { type: sourceType, id: sourceId } : undefined;
  return <CustomerConsultancyPage source={source} />;
}
