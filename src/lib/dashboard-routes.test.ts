import { describe, expect, it } from "vitest";
import { dashboardDestination, organizationHref, resolveOrganization, organizationPath, personalPath, scopeFromPath, switchScopePath } from "./dashboard-routes";

const org = "0198f0b0-0000-7000-8000-000000000001";

describe("dashboard routes", () => {
  it("builds personal and organization paths", () => {
    expect(personalPath()).toBe("/me");
    expect(personalPath("jobs")).toBe("/me/jobs");
    expect(organizationPath(org, "settings")).toBe(`/org/${org}/settings`);
  });

  it("reads scope only from a valid canonical path", () => {
    expect(scopeFromPath("/me/jobs")).toEqual({ kind: "personal" });
    expect(scopeFromPath(`/org/${org}/jobs`)).toEqual({ kind: "organization", id: org });
    expect(scopeFromPath("/org/invalid_slug/jobs")).toBeNull();
  });

  it("switches a list section without carrying foreign detail ids", () => {
    expect(switchScopePath("/me/jobs/secret", { kind: "organization", id: org })).toBe(`/org/${org}/jobs`);
    expect(switchScopePath(`/org/${org}/jobs/secret`, { kind: "personal" })).toBe("/me/jobs");
    expect(switchScopePath("/me/prompts", { kind: "organization", id: org })).toBe(`/org/${org}`);
  });

  it("accepts canonical and legacy internal sign-in destinations", () => {
    expect(dashboardDestination(`/org/${org}/settings?tab=members`)).toBe(`/org/${org}/settings?tab=members`);
    expect(dashboardDestination("/dashboard/jobs?tab=all")).toBe("/me/jobs?tab=all");
    expect(dashboardDestination(`/dashboard/workspaces/${org}/jobs`)).toBe(`/org/${org}/jobs`);
    expect(dashboardDestination("https://other.example/me")).toBe("/me");
    expect(dashboardDestination("//other.example/me")).toBe("/me");
  });
});


it("resolves member slugs without changing internal identity", () => {
  const member = { id: org, kind: "personal" as const, slug: "binary-labs" };
  expect(organizationHref(member, "settings")).toBe("/org/binary-labs/settings");
  expect(resolveOrganization("binary-labs", [member])?.id).toBe(org);
  expect(resolveOrganization(org, [member])?.id).toBe(org);
  expect(resolveOrganization("unknown", [member])).toBeUndefined();
  expect(organizationHref({ id: org })).toBe(`/org/${org}`);
  expect(dashboardDestination(`/org/${org}/jobs/job-a?view=details#result`, org, [member]))
    .toBe("/org/binary-labs/jobs/job-a?view=details#result");
  expect(dashboardDestination("/org/binary-labs/settings", org, [member])).toBe("/org/binary-labs/settings");
  expect(dashboardDestination("/org/other-team/jobs", org, [member])).toBe("/org/binary-labs");
  expect(dashboardDestination("/dashboard/jobs", org, [member])).toBe("/org/binary-labs/jobs");
});


it("rejects malformed slugs and external encoded destinations", () => {
  for (const slug of ["ab", "a".repeat(49), "-abc", "abc-", "abc--def", "ABC", "a_b", "a%2Fb"]) {
    expect(scopeFromPath(`/org/${slug}`)).toBeNull();
    expect(organizationHref({ id: org, slug })).toBe(`/org/${org}`);
  }
  for (const slug of ["abc", "a".repeat(48), "binary-labs"]) {
    expect(scopeFromPath(`/org/${slug}`)).toEqual({ kind: "organization", id: slug });
  }
  const member = { id: org, kind: "personal" as const, slug: "my-org" };
  for (const destination of ["%2F%2Fevil.example", "/%2Fevil.example", "https://evil.example/org/my-org"]) {
    expect(dashboardDestination(destination, org, [member])).toBe("/org/my-org");
  }
});
