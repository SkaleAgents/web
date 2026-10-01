import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AuditCoveragePanel } from "./audit-coverage";
import type { AuditCoverage } from "@/lib/audit-coverage";
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
