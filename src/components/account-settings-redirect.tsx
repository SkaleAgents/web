"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AccountSettingsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/account/settings"); }, [router]);
  return <main role="status">Opening account settings…</main>;
}
