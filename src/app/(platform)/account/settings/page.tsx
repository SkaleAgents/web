"use client";

import SettingsPage from "@/app/(platform)/dashboard/settings/page";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { currentUserOptions } from "@/lib/session";
import { BrandLogo } from "@/components/brand";
import { AccountMenu } from "@/components/account-menu";

export default function AccountSettingsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useQuery(currentUserOptions);
  useEffect(() => {
    if (user.isSuccess && !user.data) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [user.isSuccess, user.data, pathname, router]);
  if (!user.data) return <main role="status" className="px-6 py-16">Checking your account…</main>;
  return <>
    <header className="border-b border-line bg-canvas-elevated">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4"><BrandLogo href="/dashboard" /><span className="text-sm text-ink-muted">/ Account settings</span></div>
        <AccountMenu user={user.data} />
      </div>
    </header>
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8"><SettingsPage /></div>
  </>;
}
