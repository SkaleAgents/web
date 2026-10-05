import { expect, it } from "vitest";
import { leadFinding, plainRisk } from "./audit-risk";

it("leads with the most serious finding", () => {
  const lead = leadFinding([
    { severity: "low", title: "Minor" },
    { severity: "high", title: "Public network access detected" },
    { severity: "medium", title: "Other" },
  ]);
  expect(lead.title).toBe("Public network access detected");
});

it("says the public-access risk in plain words", () => {
  expect(plainRisk("Public network access detected", "high")).toBe("Anyone on the internet can reach this.");
});

it("uses a serious fallback when the title is unfamiliar", () => {
  expect(plainRisk("Custom control gap", "high")).toBe("This is serious enough to fix before you rely on it.");
});
