export type NavigationItem = { href: string; label: string };
export type NavigationSection = { label: string; items: NavigationItem[] };
type NavigationWorkspace = { kind: "personal" | "team"; role: "owner" | "member" | "viewer" };

const LAST_ORGANIZATION = "skale:last-organization";

// Account and Organizations pages have no organization in the URL, so they reuse the one the person came from.
export function rememberOrganization(id: string) {
  sessionStorage.setItem(LAST_ORGANIZATION, id);
}

export function rememberedOrganization(): string | null {
  return sessionStorage.getItem(LAST_ORGANIZATION);
}

// Personal settings, shown in the sidebar Account group and the profile menu.
export const accountLinks: NavigationItem[] = [
  { href: "/account/profile", label: "Profile" },
  { href: "/account/passkeys", label: "Passkeys" },
  { href: "/account/notifications", label: "Notifications" },
  { href: "/account/data", label: "Data and privacy" },
];

export function navigationSections({ workspace, root }: { workspace?: NavigationWorkspace; root: string }): NavigationSection[] {
  const yourWork = { label: "Your work", items: [
    { href: root, label: "Dashboard" },
    { href: `${root}/jobs`, label: "Audit jobs" },
    { href: `${root}/schedules`, label: "Scheduled audits" },
  ] };
  const organizations = { label: "Organizations", items: [{ href: "/organizations", label: "All organizations" }] };
  const account = { label: "Account", items: accountLinks };
  if (workspace?.kind === "team") return [
    yourWork,
    { label: "Settings", items: [
      { href: `${root}/settings`, label: "General" },
      { href: `${root}/mcp-config`, label: "MCP connections" },
      ...(workspace.role === "owner" ? [
        { href: `${root}/billing`, label: "Billing" },
        { href: `${root}/settings/retention`, label: "Audit retention" },
      ] : []),
    ] },
    organizations,
    account,
  ];
  return [
    yourWork,
    { label: "Build", items: [
      { href: `${root}/bots`, label: "My bots" },
      { href: `${root}/studio`, label: "Creator Studio" },
      { href: `${root}/prompts`, label: "My prompts" },
    ] },
    { label: "Settings", items: [{ href: `${root}/mcp-config`, label: "MCP connections" }] },
    organizations,
    account,
  ];
}

// The most specific match wins, so Audit retention doesn't also light up General.
export function activeNavigationHref(sections: NavigationSection[], pathname: string, root: string): string | undefined {
  const matches = (href: string) => pathname === href || (href !== root && pathname.startsWith(`${href}/`)) ||
    (href === `${root}/jobs` && pathname.startsWith(`${root}/watchtower/`));
  return sections.flatMap(section => section.items).map(entry => entry.href).filter(matches).sort((a, b) => b.length - a.length)[0];
}

// Your work stays open everywhere and the current page's group opens too; a group someone toggles keeps that choice.
export function groupExpanded(label: string, activeGroup: string, choices: Record<string, boolean>): boolean {
  return choices[label] ?? (label === "Your work" || label === activeGroup);
}
