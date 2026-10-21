import { LoginScreen } from "@/components/login-screen";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ oauth?: string; finish?: string; error?: string }> }) {
  const params = await searchParams;
  return <LoginScreen oauth={params.oauth === "1"} finishConnect={params.finish === "1"} error={params.error} />;
}
