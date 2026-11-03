import { expect, it } from "vitest";
import { findingsChangeLabel } from "./personal-schedule-detail";

it("names whether scheduled findings changed", () => {
  expect(findingsChangeLabel(true)).toBe("Findings changed");
  expect(findingsChangeLabel(false)).toBe("Findings unchanged");
  expect(findingsChangeLabel(null)).toBe("No earlier run to compare");
  expect(findingsChangeLabel(undefined)).toBe("No earlier run to compare");
});
