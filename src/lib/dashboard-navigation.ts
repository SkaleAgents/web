export type NavigationItem = { href: string; label: string };
export type NavigationSection = { label: string; items: NavigationItem[] };
type NavigationWorkspace = { kind: "personal" | "team"; role: "owner" | "member" | "viewer" };

const LAST_ORGANIZATION = "skale:last-organization";
const HOME_ORGANIZATION = "skale:home-organization";

// Account and Organizations pages have no organization in the URL, so they reuse the one the person came from.
export function rememberOrganization(id: string) {
  sessionStorage.setItem(LAST_ORGANIZATION, id);
  try { localStorage.setItem(HOME_ORGANIZATION, id); } catch { /* Without storage the next sign-in opens Personal. */ }
}

// shortcut: the organization last opened in this browser, not an account setting; move it to the API if people ask for one that follows them across devices.
export function homeOrganization(): string | null {
  try { return localStorage.getItem(HOME_ORGANIZATION); } catch { return null; }
}

export function rememberedOrganization(): string | null {
  return sessionStorage.getItem(LAST_ORGANIZATION);
}

// Personal settings, reached from the profile menu at the sidebar foot.
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
    { href: `${root}/mcp-config`, label: "MCP connections" },
  ] };
  const organizations = { label: "Organizations", items: [{ href: "/organizations", label: "All organizations" }] };
  if (workspace?.kind === "team") return [
    yourWork,
    { label: "Settings", items: [
      { href: `${root}/settings`, label: "General" },
      ...(workspace.role === "owner" ? [
        { href: `${root}/billing`, label: "Billing" },
        { href: `${root}/settings/retention`, label: "Audit retention" },
      ] : []),
    ] },
    organizations,
  ];
  return [
    yourWork,
    { label: "Build", items: [
      { href: `${root}/bots`, label: "My bots" },
      { href: `${root}/studio`, label: "Creator Studio" },
      { href: `${root}/prompts`, label: "My prompts" },
    ] },
    { label: "Settings", items: [
      { href: `${root}/billing`, label: "Billing" },
      { href: `${root}/house-rules`, label: "House rules" },
    ] },
    organizations,
  ];
}

// The most specific match wins, so Audit retention doesn't also light up General.
export function activeNavigationHref(sections: NavigationSection[], pathname: string, root: string): string | undefined {
  const matches = (href: string) => pathname === href || (href !== root && pathname.startsWith(`${href}/`)) ||
    (href === `${root}/jobs` && pathname.startsWith(`${root}/watchtower/`));
  return sections.flatMap(section => section.items).map(entry => entry.href).filter(matches).sort((a, b) => b.length - a.length)[0];
}

// Your work, the current page's group and one-link groups start open; a group someone toggles keeps that choice.
export function groupExpanded(label: string, activeGroup: string, choices: Record<string, boolean>, singleItem = false): boolean {
  return choices[label] ?? (label === "Your work" || label === activeGroup || singleItem);
}
