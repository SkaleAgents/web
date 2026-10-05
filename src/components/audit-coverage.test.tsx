import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AuditCoveragePanel, ClearCheckSummary, SkippedCheckList } from "./audit-coverage";
import { findingPlace, type AuditCoverage, type CheckResult } from "@/lib/audit-coverage";
afterEach(cleanup);

it("does not infer a clean audit from unavailable historical coverage", () => {
  render(<AuditCoveragePanel status="completed" tasks={[]} />);
  expect(screen.getByText("Check details unavailable")).toBeInTheDocument();
  expect(screen.queryByText(/all checks passed/i)).not.toBeInTheDocument();
});
it("distinguishes pending from cancelled or failed tasks without records", () => {
  const { rerender } = render(<AuditCoveragePanel status="running" tasks={[{ specialist: "sre", status: "running" }]} />);
  expect(screen.getByText("Awaiting results")).toBeInTheDocument();
  rerender(<AuditCoveragePanel status="failed" tasks={[{ specialist: "sre", status: "failed" }]} />);
  expect(screen.getByText("Check details unavailable")).toBeInTheDocument();
  expect(screen.queryByText("Awaiting results")).not.toBeInTheDocument();
});
it("shows partial evaluated checks, skips, failures and missing tasks separately", () => {
  const coverage: AuditCoverage = {
    basis: "rule_execution", recordingStatus: "partial", ruleLevelChecksAvailable: true,
    limitation: "These checks review supplied input.", counts: { evaluated: 1, partial: 1, skipped: 1, failed: 1 }, tasksWithoutCoverage: 1,
    tasks: [{ specialist: "sre", status: "completed", hasSkipReason: true, checkCoverage: { version: "builtin-coverage-v1", checks: [
      { ruleId: "sre.elevated-error-rate", status: "evaluated", completeness: "partial", findingCount: 1, reasonCodes: ["invalid_input"] },
      { ruleId: "sre.failed-crons", status: "skipped", completeness: "none", findingCount: 0, reasonCodes: ["missing_input"] },
      { ruleId: "sre.retry-pattern", status: "failed", completeness: "none", findingCount: 0, reasonCodes: ["execution_failed"] },
    ] } }, { specialist: "devsecops", status: "failed", hasSkipReason: true, checkCoverage: null }],
  };
  render(<AuditCoveragePanel status="completed" coverage={coverage} />);
  expect(screen.getByText(/1 evaluated · 1 skipped · 1 failed/)).toBeInTheDocument();
  expect(screen.getByText("Evaluated, partial coverage")).toBeInTheDocument();
  expect(screen.getByText("1 finding")).toBeInTheDocument();
  expect(screen.getByText("Check details unavailable")).toBeInTheDocument();
  expect(screen.getByText("Required input was not supplied.")).toBeInTheDocument();
  expect(screen.getByText("Reliability").closest("details")).toHaveAttribute("open");
  expect(screen.getByText("Security").closest("details")).not.toHaveAttribute("open");
});

it("lists skipped checks and a finding path with its line", () => {
  const coverage: AuditCoverage = {
    basis: "rule_execution", recordingStatus: "available", ruleLevelChecksAvailable: true,
    limitation: "These checks review supplied input.", counts: { evaluated: 0, partial: 0, skipped: 1, failed: 0 }, tasksWithoutCoverage: 0,
    tasks: [{ specialist: "devsecops", status: "completed", checkCoverage: { version: "builtin-coverage-v1", checks: [
      { ruleId: "iac.container-image-scan", status: "skipped", completeness: "none", findingCount: 0, reasonCodes: ["scanner_unavailable"] },
    ] } }],
  };
  render(<SkippedCheckList coverage={coverage} />);
  expect(screen.getByText(/Container image scan/)).toBeInTheDocument();
  expect(screen.getByText(/Container image scanning is not configured/)).toBeInTheDocument();
  expect(findingPlace({ resource: "source", location: { path: "source", line: 4 } })).toBe("source line 4");
  expect(findingPlace({ resource: "aws_db_instance.app", location: { path: "resource.aws_db_instance.app", line: 2 } })).toBe("aws_db_instance.app · resource.aws_db_instance.app line 2");
});

it("names the checks that ran when an audit has no findings", () => {
  const evaluated = (ruleId: string, title?: string): CheckResult => ({
    ruleId, ...(title ? { title } : {}), status: "evaluated", completeness: "complete", findingCount: 0, reasonCodes: [],
  });
  const ids = [
    "iac.public-network-access", "NET001", "IAM001", "DB001", "DATA002", "DB002", "SEC002", "SEC003", "K8S001",
    "SEC001", "DATA001", "VM001", "K8S008",
  ];
  const coverage: AuditCoverage = {
    basis: "rule_execution", recordingStatus: "available", ruleLevelChecksAvailable: true,
    limitation: "These checks review supplied input.", counts: { evaluated: ids.length, partial: 0, skipped: 1, failed: 0 }, tasksWithoutCoverage: 0,
    tasks: [{ specialist: "devsecops", status: "completed", checkCoverage: { version: "builtin-coverage-v1", checks: [
      evaluated("custom.rule", "API supplied title"),
      ...ids.map((ruleId) => evaluated(ruleId)),
      { ruleId: "iac.container-image-scan", status: "skipped", completeness: "none", findingCount: 0, reasonCodes: ["scanner_unavailable"] },
    ] } }],
  };
  const { rerender } = render(<>
    <ClearCheckSummary coverage={coverage} />
    <SkippedCheckList coverage={coverage} />
    <AuditCoveragePanel status="completed" coverage={coverage} />
  </>);
  expect(screen.getByText("These checks ran and found nothing.")).toBeInTheDocument();
  expect(screen.getAllByText("Public network access").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Broad network exposure").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Wildcard permission detected").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Public database").length).toBeGreaterThan(0);
  expect(screen.getAllByText("API supplied title").length).toBeGreaterThan(0);
  expect(screen.getByText(/2 more ran/)).toBeInTheDocument();
  const summary = screen.getByText("These checks ran and found nothing.").parentElement;
  expect(summary?.textContent).not.toContain("Container image scan");
  expect(screen.getAllByText(/Container image scan/).length).toBeGreaterThan(0);
  expect(screen.getByText("Skipped")).toBeInTheDocument();
  rerender(<h3>Wildcard permission detected</h3>);
  expect(screen.queryByText("These checks ran and found nothing.")).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Wildcard permission detected" })).toBeInTheDocument();
});
