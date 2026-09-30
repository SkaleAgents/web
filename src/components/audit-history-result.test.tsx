import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { AuditHistoryResult } from "./audit-history-result";

afterEach(cleanup);
it("shows count and highest severity without a full report", () => {
  render(<AuditHistoryResult job={{ status: "completed", partial: false, findingSummary: { total: 3, highestSeverity: "critical" } }} />);
  expect(screen.getByText("3 findings")).toBeVisible();
  expect(screen.getByText("Critical severity")).toBeVisible();
});
it("does not call missing results clear", () => {
  render(<AuditHistoryResult job={{ status: "completed", partial: false }} />);
  expect(screen.getByText("Findings unavailable")).toBeVisible();
  expect(screen.queryByText("No findings")).not.toBeInTheDocument();
});
it("labels completed empty results with a coverage reminder", () => {
  render(<AuditHistoryResult job={{ status: "completed", partial: false, findingSummary: { total: 0, highestSeverity: null } }} />);
  expect(screen.getByText("No findings")).toBeVisible();
  expect(screen.getByText("Review coverage limits")).toBeVisible();
});
it.each(["failed", "completed"] as const)("keeps %s partial results distinct from a completed clean result", status => {
  render(<AuditHistoryResult job={{ status, partial: true, findingSummary: { total: 0, highestSeverity: null } }} />);
  expect(screen.getByText("Incomplete results")).toBeVisible();
  expect(screen.getByText("0 findings recorded")).toBeVisible();
  expect(screen.queryByText("No findings")).not.toBeInTheDocument();
});
it("does not present active results as final", () => {
  render(<AuditHistoryResult job={{ status: "running", partial: false, findingSummary: { total: 0, highestSeverity: null } }} />);
  expect(screen.getByText("Audit in progress")).toBeVisible();
  expect(screen.queryByText("No findings")).not.toBeInTheDocument();
});
