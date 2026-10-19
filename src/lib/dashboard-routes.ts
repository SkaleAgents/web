export type DashboardScope = { kind: "personal" } | { kind: "organization"; id: string };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const slugPattern = /^(?=.{3,48}$)[a-z0-9]+(?:-[a-z0-9]+)*$/;
const validReference = (value: string) => uuidPattern.test(value) || slugPattern.test(value);
const sharedSections = new Set(["jobs", "schedules", "settings"]);

export type OrganizationIdentity = { id: string; kind: "personal" | "team"; slug?: string | null };

export function resolveOrganization<T extends { id: string; slug?: string | null }>(reference: string, memberships: T[]): T | undefined {
  return memberships.find(item => item.id === reference || Boolean(item.slug && item.slug === reference));
}

export function organizationHref(organization: { id: string; slug?: string | null }, section = ""): string {
  return organizationPath(organization.slug && slugPattern.test(organization.slug) ? organization.slug : organization.id, section);
}

export function personalOrganizationId(memberships: OrganizationIdentity[]): string | null {
  return memberships.find(item => item.kind === "personal" && uuidPattern.test(item.id))?.id ?? null;
}

export function personalPath(section = ""): string {
  return section ? `/me/${section}` : "/me";
}

export function organizationPath(id: string, section = ""): string {
  if (!validReference(id)) throw new Error("Invalid organization ID.");
  return section ? `/org/${id}/${section}` : `/org/${id}`;
}

export function personalDestinationFromPath(pathname: string, section = ""): string {
  const scope = scopeFromPath(pathname);
  return scope?.kind === "organization" ? organizationPath(scope.id, section) : personalPath(section);
}

export function scopeFromPath(pathname: string): DashboardScope | null {
  if (pathname === "/me" || pathname.startsWith("/me/")) return { kind: "personal" };
  const match = pathname.match(/^\/org\/([^/]+)(?:\/|$)/);
  return match && validReference(match[1]) ? { kind: "organization", id: match[1] } : null;
}

export function switchScopePath(pathname: string, target: DashboardScope): string {
  const source = scopeFromPath(pathname);
  const suffix = source?.kind === "organization"
    ? pathname.slice(`/org/${source.id}`.length)
    : source?.kind === "personal" ? pathname.slice(3) : "";
  const section = suffix.split("/")[1] ?? "";
  const base = target.kind === "personal" ? personalPath() : organizationPath(target.id);
  if (target.kind === "organization" && !sharedSections.has(section)) return base;
  if (!section) return base;
  return `${base}/${section}`;
}

export function legacyDashboardPath(pathname: string): string | null {
  if (pathname === "/dashboard") return "/me";
  if (!pathname.startsWith("/dashboard/")) return null;
  const suffix = pathname.slice("/dashboard/".length);
  if (suffix === "workspaces") return "/me/organizations";
  const organization = suffix.match(/^workspaces\/([^/]+)(?:\/(.*))?$/);
  if (organization?.[1] && uuidPattern.test(organization[1])) {
    const section = organization[2] === "retention" ? "settings/retention" : organization[2] ?? "";
    return organizationPath(organization[1], section);
  }
  if (suffix === "billing") return "/me/organizations";
  if (suffix === "staff" || suffix.startsWith("staff/")) return `/${suffix}`;
  return personalPath(suffix);
}

export function dashboardDestination(value: string | null, personalId?: string | null, memberships?: OrganizationIdentity[]): string {
  const personal = memberships?.find(item => item.id === personalId);
  const fallback = personal ? organizationHref(personal) : personalId && uuidPattern.test(personalId) ? organizationPath(personalId) : "/me";
  if (!value || value.startsWith("//")) return fallback;
  try {
    const base = "https://skaleagents.com";
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    if (personalId && uuidPattern.test(personalId)) {
      const path = url.pathname;
      let destination: string | null = null;
      if (path === "/me" || path === "/dashboard") destination = fallback;
      else if (path === "/me/settings" || path === "/dashboard/settings") destination = "/account/notifications";
      else if (path === "/me/organizations" || path === "/dashboard/workspaces") destination = organizationPath(personalId, "organizations");
      else if (path.startsWith("/me/")) destination = organizationPath(personalId, path.slice(4));
      else if (path.startsWith("/dashboard/workspaces/")) {
        const match = path.match(/^\/dashboard\/workspaces\/([^/]+)(?:\/(.*))?$/);
        if (match && validReference(match[1])) destination = organizationPath(match[1], match[2] === "retention" ? "settings/retention" : match[2] ?? "");
      } else if (path.startsWith("/dashboard/")) destination = organizationPath(personalId, path.slice(11));
      else if (path.startsWith("/account/") || path === "/staff" || path.startsWith("/staff/")) destination = path;
      else if (scopeFromPath(path)) destination = path;
      if (destination?.startsWith("/org/")) {
        const scope = scopeFromPath(destination);
        if (!scope || scope.kind !== "organization") return fallback;
        const member = memberships && resolveOrganization(scope.id, memberships);
        if (memberships && !member) return fallback;
        if (member) destination = organizationHref(member) + destination.slice(`/org/${scope.id}`.length);
      }
      return destination ? `${destination}${url.search}${url.hash}` : fallback;
    }
    const legacy = legacyDashboardPath(url.pathname);
    if (legacy) return `${legacy}${url.search}${url.hash}`;
    if (scopeFromPath(url.pathname) || url.pathname === "/staff" || url.pathname.startsWith("/staff/")) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch { /* Invalid destinations open personal home. */ }
  return fallback;
}
