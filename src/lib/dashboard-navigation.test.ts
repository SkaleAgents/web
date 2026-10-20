import { afterEach, describe, expect, it } from "vitest";
import { activeNavigationHref, groupExpanded, navigationSections, rememberedOrganization, rememberOrganization } from "./dashboard-navigation";

const labels = (sections: ReturnType<typeof navigationSections>) => sections.map(section => [section.label, section.items.map(item => item.label)]);

afterEach(() => sessionStorage.clear());

describe("navigationSections", () => {
  it("gives team owners organization settings, then Organizations, then personal Account", () => {
    expect(labels(navigationSections({ workspace: { kind: "team", role: "owner" }, root: "/org/acme" }))).toEqual([
      ["Your work", ["Dashboard", "Audit jobs", "Scheduled audits"]],
      ["Settings", ["General", "MCP connections", "Billing", "Audit retention"]],
      ["Organizations", ["All organizations"]],
      ["Account", ["Passkeys", "Notifications", "Data and privacy"]],
    ]);
  });

  it("hides owner-only settings from team members", () => {
    const settings = navigationSections({ workspace: { kind: "team", role: "member" }, root: "/org/acme" })[1];
    expect(settings.items.map(item => item.label)).toEqual(["General", "MCP connections"]);
  });

  it("gives Personal its build tools and links Organizations to its own page from any scope", () => {
    const personal = navigationSections({ workspace: { kind: "personal", role: "owner" }, root: "/org/me" });
    expect(personal.map(section => section.label)).toEqual(["Your work", "Build", "Settings", "Organizations", "Account"]);
    const team = navigationSections({ workspace: { kind: "team", role: "owner" }, root: "/org/acme" });
    expect(team[2].items[0].href).toBe("/organizations");
    expect(team.flatMap(section => section.items).find(item => item.label === "Passkeys")?.href).toBe("/account/passkeys");
  });
});

describe("activeNavigationHref", () => {
  const sections = navigationSections({ workspace: { kind: "team", role: "owner" }, root: "/org/acme" });

  it("picks the most specific item", () => {
    expect(activeNavigationHref(sections, "/org/acme/settings/retention", "/org/acme")).toBe("/org/acme/settings/retention");
    expect(activeNavigationHref(sections, "/org/acme/settings", "/org/acme")).toBe("/org/acme/settings");
  });

  it("keeps Dashboard exact and maps watchtower sessions to Audit jobs", () => {
    expect(activeNavigationHref(sections, "/org/acme", "/org/acme")).toBe("/org/acme");
    expect(activeNavigationHref(sections, "/org/acme/unknown", "/org/acme")).toBeUndefined();
    expect(activeNavigationHref(sections, "/org/acme/watchtower/s1", "/org/acme")).toBe("/org/acme/jobs");
  });
});

describe("groupExpanded", () => {
  it("keeps Your work and the current group open until someone closes them", () => {
    expect(groupExpanded("Your work", "Settings", {})).toBe(true);
    expect(groupExpanded("Settings", "Settings", {})).toBe(true);
    expect(groupExpanded("Account", "Settings", {})).toBe(false);
    expect(groupExpanded("Your work", "Settings", { "Your work": false })).toBe(false);
    expect(groupExpanded("Account", "Settings", { Account: true })).toBe(true);
  });
});

it("remembers the last organization for Account pages", () => {
  expect(rememberedOrganization()).toBeNull();
  rememberOrganization("acme-id");
  expect(rememberedOrganization()).toBe("acme-id");
});
