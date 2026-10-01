import { expect, it } from "vitest";
import { reportToCsv, reportToJson, reportToPdf, type ComplianceReport } from "./compliance-report-export";

const report: ComplianceReport = {
  generatedAt: "2026-09-26T11:09:53+00:00",
  job: { id: "audit-1", status: "completed", summary: "1 specialist task completed.", partial: false, dispatchActor: "scheduler" },
  controls: [
    {
      theme: "access",
      findingCount: 1,
      findings: [{
        severity: "high",
        title: "Public network access detected",
        detail: "The IaC contains an unrestricted source range.",
        resource: "aws_security_group.ssh",
        remediation: "Restrict ingress.",
        specialist: "devsecops",
      }],
    },
    { theme: "logging", findingCount: 0, findings: [] },
  ],
  unmappedFindings: [],
};

it("keeps the original JSON payload readable", () => {
  expect(reportToJson(report)).toContain('"title": "Public network access detected"');
});

it("puts each finding on a CSV row and keeps an empty theme visible", () => {
  const csv = reportToCsv(report);
  expect(csv.split("\n")[0]).toBe("theme,finding_count,severity,title,detail,resource,remediation,specialist,note");
  expect(csv).toContain("access,1,high,Public network access detected");
  expect(csv).toContain("logging,0,,,,,,,No finding recorded. This does not mean the theme passed.");
});

it("quotes CSV cells that contain commas and neutralizes spreadsheet formulas", () => {
  const csv = reportToCsv({
    controls: [{ theme: "access", findingCount: 1, findings: [{ title: "Open, public", detail: "line\nbreak", remediation: "=cmd|' /C calc'!A0" }] }],
  });
  expect(csv).toContain('"Open, public"');
  expect(csv).toContain('"line\nbreak"');
  expect(csv).toContain("'=cmd|' /C calc'!A0");
});

it("writes a PDF that names the recorded finding and the empty-theme limit", () => {
  const pdf = new TextDecoder().decode(reportToPdf(report));
  expect(pdf.startsWith("%PDF-1.4")).toBe(true);
  expect(pdf).toContain("Public network access detected");
  expect(pdf).toContain("Empty themes are not a pass");
  expect(pdf).toContain("Queued by: scheduled run");
  expect(pdf).toContain("logging: 0 recorded");
});
