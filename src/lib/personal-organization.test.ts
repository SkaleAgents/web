import { describe, expect, it } from "vitest";
import { dashboardDestination, personalOrganizationId } from "./dashboard-routes";

const personal = "0198f0b0-0000-7000-8000-000000000001";
const team = "0198f0b0-0000-7000-8000-000000000002";
const memberships = [
  { id: personal, name: "Personal", kind: "personal" as const },
  { id: team, name: "Platform", kind: "team" as const },
];

describe("personal organization resolution", () => {
  it("finds only a personal organization", () => {
    expect(personalOrganizationId(memberships)).toBe(personal);
    expect(personalOrganizationId(memberships.slice(1))).toBeNull();
  });

  it("maps legacy personal links and preserves valid team links", () => {
    expect(dashboardDestination("/me/jobs", personal, memberships)).toBe(`/org/${personal}/jobs`);
    expect(dashboardDestination("/me/settings", personal, memberships)).toBe("/account/notifications");
    expect(dashboardDestination(`/dashboard/workspaces/${team}/jobs/job-1`, personal, memberships)).toBe(`/org/${team}/jobs/job-1`);
    expect(dashboardDestination(`/org/${team}/billing?checkout=return`, personal, memberships)).toBe(`/org/${team}/billing?checkout=return`);
    expect(dashboardDestination("https://evil.example/me", personal, memberships)).toBe(`/org/${personal}`);
    expect(dashboardDestination(`/org/${team}/jobs`, personal, memberships.slice(0, 1))).toBe(`/org/${personal}`);
  });
});
