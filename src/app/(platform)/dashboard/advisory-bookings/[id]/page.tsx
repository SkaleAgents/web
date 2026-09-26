import { CustomerBookingDetail } from "@/components/customer-bookings";

export default async function AdvisoryBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerBookingDetail id={id} />;
}
