import { expect, it } from "vitest";
import { leadFinding, plainRisk, rankFindings } from "./audit-risk";

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

it("ranks findings by severity and keeps the original order within a severity", () => {
  const findings = [
    { severity: "low", title: "low-a" },
    { severity: "high", title: "high-b" },
    { severity: "critical", title: "critical-a" },
    { severity: "high", title: "high-a" },
    { severity: "info", title: "info-a" },
    { severity: "medium", title: "medium-a" },
    { severity: "low", title: "low-b" },
  ];
  expect(rankFindings(findings).map((finding) => finding.title)).toEqual([
    "critical-a",
    "high-b",
    "high-a",
    "medium-a",
    "low-a",
    "low-b",
    "info-a",
  ]);
  expect(rankFindings(findings).map((finding) => finding.title)).toEqual(rankFindings(findings).map((finding) => finding.title));
});
