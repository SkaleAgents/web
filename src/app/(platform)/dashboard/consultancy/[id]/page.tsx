import { CustomerConsultancyDetailPage } from "@/components/customer-consultancy-page";

export default async function ConsultancyDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { id } = await params;
  const { checkout } = await searchParams;
  return <CustomerConsultancyDetailPage id={id} checkoutReturned={checkout === "return"} />;
}
