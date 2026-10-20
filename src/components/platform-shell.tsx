"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { PasskeyConfirmation } from "@/components/passkey-confirmation";

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dashboard = ["/org", "/organizations", "/account", "/dashboard", "/me"].some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return <>{dashboard ? <DashboardShell>{children}</DashboardShell> : children}<PasskeyConfirmation /></>;
}
