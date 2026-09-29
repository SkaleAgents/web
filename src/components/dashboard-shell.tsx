"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { currentUserOptions } from "@/lib/session";
import { advisoryAgreementsEnabled, nativeConsultancyEnabled } from "@/lib/api";
import { isStaff } from "@/lib/advisory-bookings";
import { Button } from "@/components/ui";
import { BrandLogo } from "@/components/brand";
import { AccountMenu } from "@/components/account-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { apiFetch } from "@/lib/api";
import { organizationPath, personalPath, scopeFromPath } from "@/lib/dashboard-routes";
import { OrganizationSwitcher, type OrganizationMembership } from "@/components/organization-switcher";

type NavigationItem = { href: string; label: string };
type NavigationSection = { label: string; items: NavigationItem[] };

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useQuery(currentUserOptions);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const menuToggle = useRef<HTMLButtonElement>(null);
  const scope = scopeFromPath(pathname) ?? { kind: "personal" as const };
  const memberships = useQuery({
    queryKey: ["workspaces", user.data?.id ?? "guest"],
    enabled: Boolean(user.data?.id),
    queryFn: async ({ signal }) => (await apiFetch<{ data: OrganizationMembership[] }>("/api/workspaces", { signal })).data,
    refetchInterval: scope.kind === "organization" ? 60_000 : false,
  });
  useEffect(() => {
    if (user.isSuccess && !user.data) {
      router.replace(`/login?next=${encodeURIComponent(pathname + window.location.search)}`);
    }
  }, [pathname, router, user.isSuccess, user.data]);

  const workspace = scope.kind === "organization" ? memberships.data?.find(item => item.id === scope.id) : null;
  const root = scope.kind === "organization" ? organizationPath(scope.id) : personalPath();
  const sections: NavigationSection[] = scope.kind === "organization" ? [
    { label: "Your work", items: [
      { href: root, label: "Overview" },
      { href: `${root}/jobs`, label: "Audit jobs" },
      { href: `${root}/schedules`, label: "Scheduled audits" },
    ] },
    { label: "Organization", items: [
      { href: `${root}/settings`, label: "Settings" },
      ...(workspace?.role === "owner" ? [{ href: `${root}/billing`, label: "Billing" }] : []),
    ] },
  ] : [
    { label: "Your work", items: [
      { href: root, label: "Overview" },
      { href: `${root}/jobs`, label: "Audit jobs" },
      { href: `${root}/schedules`, label: "Scheduled audits" },
      { href: `${root}/organizations`, label: "Organizations" },
    ] },
    { label: "Build", items: [
      { href: `${root}/bots`, label: "My bots" },
      { href: `${root}/studio`, label: "Creator Studio" },
      { href: `${root}/prompts`, label: "My prompts" },
    ] },
    { label: "Account", items: [
      { href: `${root}/mcp-config`, label: "MCP connections" },
      { href: `${root}/settings`, label: "Settings" },
    ] },
  ];
  if (scope.kind === "personal" && advisoryAgreementsEnabled()) sections.push({ label: "Advisory", items: [
    { href: `${root}/advisory-bookings`, label: "Advisory requests" },
  ] });
  if (scope.kind === "personal" && nativeConsultancyEnabled()) sections.push({ label: "Consultancy", items: [
    { href: `${root}/consultancy`, label: "My bookings" },
  ] });
  if (user.data && isStaff(user.data)) sections.push({ label: "Staff", items: [
    { href: "/staff/advisory-bookings", label: "Staff bookings" },
    ...(nativeConsultancyEnabled() ? [{ href: "/staff/consultancy", label: "Consultancy requests" }] : []),
  ] });

  const active = (href: string) => pathname === href || (href !== root && pathname.startsWith(`${href}/`)) ||
    (href === `${root}/jobs` && pathname.startsWith(`${root}/watchtower/`));
  const activeGroup = sections.find(section => section.items.some(entry => active(entry.href)))?.label ?? "Your work";
  const currentSection = sections.flatMap(section => section.items).find(entry => active(entry.href))?.label ?? "Overview";
  const groupKey = (label: string) => `${pathname}:${label}`;
  const groupExpanded = (label: string) => expandedGroups[groupKey(label)] ?? label === activeGroup;

  if (user.isError) return <main className="mx-auto max-w-lg space-y-4 px-6 py-16" role="alert">
    <h1 className="text-xl font-semibold">Could not check your session</h1>
    <p className="text-sm text-ink-muted">Try again to open your dashboard.</p>
    <Button onClick={() => void user.refetch()}>Try again</Button>
  </main>;
  if (!user.data) return <main className="px-6 py-16 text-center text-sm text-ink-muted" role="status">Checking your session…</main>;
  if (pathname.startsWith("/org/") && !scopeFromPath(pathname)) return <main role="alert" className="px-6 py-16">Organization unavailable.</main>;
  if (scope.kind === "organization" && memberships.isPending) return <main role="status" className="px-6 py-16">Checking organization access…</main>;
  if (scope.kind === "organization" && memberships.isError) return <main role="alert" className="px-6 py-16">Could not check organization access. <Button onClick={() => void memberships.refetch()}>Try again</Button></main>;
  if (scope.kind === "organization" && !workspace) return <main role="alert" className="px-6 py-16">Organization unavailable. <Link href="/me">Open personal home</Link></main>;

  function closeMenu() {
    setMenuOpen(false);
    if (menuOpen) menuToggle.current?.focus();
  }
  const item = ({ href, label }: NavigationItem) => (
    <Link key={href} href={href} onClick={closeMenu}
      aria-label={label}
      aria-current={active(href) ? "page" : undefined}
      className={`dashboard-nav-item ${active(href) ? "is-active" : ""}`}>
      <DashboardIcon href={href} />
      <span className="dashboard-nav-text">{label}</span>
    </Link>
  );

  return <div className={`dashboard-frame ${collapsed ? "is-collapsed" : ""}`}>
    <aside className="dashboard-sidebar">
      <nav aria-label="Dashboard navigation" className="dashboard-navigation" onKeyDown={event => {
        if (event.key === "Escape" && menuOpen) {
          event.preventDefault();
          closeMenu();
        }
      }}>
        <div className="dashboard-brand">
          <span className="dashboard-brand-logo"><BrandLogo href={root} /></span>
          <button type="button" className="dashboard-collapse-toggle" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed(value => !value)}>{collapsed ? "»" : "«"}</button>
          <button ref={menuToggle} type="button" className="dashboard-menu-toggle"
            aria-expanded={menuOpen} aria-controls="dashboard-sections"
            onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? "Close menu" : "Open menu"}
          </button>
        </div>
        <div id="dashboard-sections" className={`dashboard-sections ${menuOpen ? "is-open" : ""}`}>
          <div className="dashboard-section-list">
            {sections.map(section => <div key={section.label} className="dashboard-nav-group">
              <button type="button" className="dashboard-nav-label" aria-expanded={collapsed || groupExpanded(section.label)}
                onClick={() => { if (collapsed) setCollapsed(false); else setExpandedGroups(current => ({ ...current, [groupKey(section.label)]: !groupExpanded(section.label) })); }}>
                {section.label}<span aria-hidden="true">⌄</span>
              </button>
              <div className="dashboard-nav-items" hidden={!collapsed && !groupExpanded(section.label)}>
                {section.items.map(item)}
              </div>
            </div>)}
          </div>
          <div className="dashboard-site-link">
            <Link href="/" onClick={closeMenu} className="flex items-center justify-between gap-3 text-sm text-ink-muted hover:text-ink">
              Visit public site <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </nav>
    </aside>
    <div className="min-w-0">
      <header className="dashboard-toolbar">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <OrganizationSwitcher scope={scope} pathname={pathname} memberships={memberships.data ?? []} />
          <span aria-hidden="true" className="text-line">{" / "}</span>
          <span className="truncate font-semibold">{currentSection}</span>
        </div>
        <div className="flex items-center gap-2"><ThemeSwitcher /><AccountMenu key={user.data.id} user={user.data} /></div>
      </header>
      <div className="dashboard-content" key={`${user.data.id}:${root}`}>{children}</div>
    </div>
  </div>;
}

function DashboardIcon({ href }: { href: string }) {
  const name = href.split("/").at(-1);
  const paths: Record<string, React.ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    jobs: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2h6v2m-7 8 3 3 5-6" /></>,
    schedules: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 2v6m10-6v6M3 10h18m-13 5h2m4 0h2" /></>,
    workspaces: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1H3Zm13-9a3 3 0 1 0 0-6m1 9a5 5 0 0 1 4 5v1h-3" /></>,
    billing: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
    bots: <><rect x="4" y="7" width="16" height="13" rx="3" /><path d="M12 3v4M8 12v2m8-2v2M9 17h6" /></>,
    studio: <><path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14v6ZM4 20h16" /></>,
    prompts: <><path d="M4 4h16v13H9l-5 4V4Z" /><path d="M8 8h8M8 12h5" /></>,
    "mcp-config": <><path d="M8 2v5m8-5v5M6 7h12v3a6 6 0 0 1-12 0V7Zm6 9v6" /></>,
    settings: <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="2" fill="var(--canvas-elevated)" /><circle cx="15" cy="17" r="2" fill="var(--canvas-elevated)" /></>,
  };
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {paths[name ?? ""] ?? <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8m-8 4h4" /></>}
  </svg>;
}
