import { StaffBookingDetail } from "@/components/staff-booking-detail";

export default async function StaffBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StaffBookingDetail key={id} id={id} />;
}
