import { LoginScreen } from "@/components/login-screen";

export default async function EmailSignupPage({ searchParams }: { searchParams: Promise<{ oauth?: string; finish?: string }> }) {
  const params = await searchParams;
  return <LoginScreen email signup oauth={params.oauth === "1"} finishConnect={params.finish === "1"} />;
}
