"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dashboard = ["/org/", "/account/", "/dashboard"].some(prefix => pathname.startsWith(prefix));
  return dashboard ? <DashboardShell>{children}</DashboardShell> : children;
}
