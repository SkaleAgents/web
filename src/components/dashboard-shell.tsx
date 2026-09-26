"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { currentUserOptions } from "@/lib/session";
import { advisoryAgreementsEnabled } from "@/lib/api";
import { isStaff } from "@/lib/advisory-bookings";
import { Button } from "@/components/ui";

const sections = [
  { label: "Workspace", items: [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/jobs", label: "Audit jobs" },
    { href: "/dashboard/schedules", label: "Scheduled audits" },
    { href: "/dashboard/workspaces", label: "Workspaces" },
  ] },
  { label: "Build", items: [
    { href: "/dashboard/bots", label: "My bots" },
    { href: "/dashboard/studio", label: "Creator Studio" },
    { href: "/dashboard/prompts", label: "My prompts" },
  ] },
  { label: "Account", items: [
    { href: "/dashboard/mcp-config", label: "MCP connections" },
    { href: "/dashboard/settings", label: "Settings" },
  ] },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useQuery(currentUserOptions);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (user.isSuccess && !user.data) {
      router.replace(`/login?next=${encodeURIComponent(pathname + window.location.search)}`);
    }
  }, [pathname, router, user.isSuccess, user.data]);

  if (user.isError) return <main className="mx-auto max-w-lg space-y-4 px-6 py-16" role="alert">
    <h1 className="text-xl font-semibold">Could not check your session</h1>
    <p className="text-sm text-ink-muted">Try again to open your dashboard.</p>
    <Button onClick={() => void user.refetch()}>Try again</Button>
  </main>;
  if (!user.data) return <main className="px-6 py-16 text-center text-sm text-ink-muted" role="status">Checking your session…</main>;

  const active = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`)) || (href === "/dashboard/jobs" && pathname.startsWith("/dashboard/watchtower/"));
  const item = ({ href, label }: { href: string; label: string }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)}
    aria-current={active(href) ? "page" : undefined}
    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active(href) ? "bg-accent-soft text-accent" : "text-ink-muted hover:bg-canvas hover:text-ink"}`}>{label}</Link>;
  return <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-10 lg:py-8">
    <aside className="min-w-0">
      <nav aria-label="Dashboard navigation" className="rounded-xl border border-line bg-canvas-elevated p-3 lg:sticky lg:top-6">
        <div className="flex items-center justify-between gap-3 px-3 py-2"><p className="font-display text-lg font-bold">Dashboard</p><button type="button" className="text-sm font-semibold text-accent lg:hidden" aria-expanded={menuOpen} aria-controls="dashboard-sections" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close menu" : "Open menu"}</button></div>
        <div id="dashboard-sections" className={`${menuOpen ? "grid" : "hidden"} gap-3 sm:grid-cols-3 lg:grid lg:grid-cols-1`}>
          {sections.map(section => <div key={section.label}>
            <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">{section.label}</p>
            {section.items.map(item)}
          </div>)}
          {advisoryAgreementsEnabled() && <div>
            <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">Advisory</p>
            {item({ href: "/dashboard/advisory-bookings", label: "Advisory requests" })}
            {isStaff(user.data) && item({ href: "/dashboard/staff/advisory-bookings", label: "Staff bookings" })}
          </div>}
        </div>
        <div className="mt-3 border-t border-line px-3 pt-3"><Link href="/" className="text-sm text-ink-muted hover:text-ink">Visit public site ↗</Link></div>
      </nav>
    </aside>
    <div className="min-w-0" key={user.data.id}>{children}</div>
  </div>;
}
