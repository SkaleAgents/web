import { describe, expect, it } from "vitest";
import { dashboardDestination } from "./dashboard";

describe("dashboardDestination", () => {
  it("opens personal home by default", () => {
    expect(dashboardDestination(null)).toBe("/me");
  });

  it("keeps canonical organization links after sign-in", () => {
    expect(dashboardDestination("/org/0198f0b0-0000-7000-8000-000000000001/jobs"))
      .toBe("/org/0198f0b0-0000-7000-8000-000000000001/jobs");
  });
});
