import { describe, expect, it } from "vitest";
import { dashboardDestination, organizationPath, personalPath, scopeFromPath, switchScopePath } from "./dashboard-routes";

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
    expect(scopeFromPath("/org/not-an-id/jobs")).toBeNull();
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
