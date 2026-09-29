import { AccountAgreementScreen } from "@/components/account-agreement-screen";

export default async function AgreementPage({ searchParams }: { searchParams: Promise<{ next?: string; oauth?: string }> }) {
  const params = await searchParams;
  return <AccountAgreementScreen next={params.next ?? null} oauth={params.oauth === "1"} />;
}
