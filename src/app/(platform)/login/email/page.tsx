import { LoginScreen } from "@/components/login-screen";

export default async function EmailLoginPage({ searchParams }: { searchParams: Promise<{ oauth?: string; finish?: string }> }) {
  const params = await searchParams;
  return <LoginScreen email oauth={params.oauth === "1"} finishConnect={params.finish === "1"} />;
}
