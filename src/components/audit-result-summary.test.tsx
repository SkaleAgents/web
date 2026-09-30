import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AuditResultSummary } from "./audit-result-summary";

describe("audit result guidance", () => {
  afterEach(cleanup);
  it("does not treat missing findings as a clean result", () => {
    render(<AuditResultSummary job={{ status: "completed", partial: false }} />);
    expect(screen.getByRole("heading")).toHaveTextContent("Findings unavailable");
    expect(screen.getByText(/cannot tell whether issues were found/)).toBeVisible();
  });
  it("keeps zero findings separate from a security assurance", () => {
    render(<AuditResultSummary job={{ status: "completed", partial: false, findings: [] }} />);
    expect(screen.getByRole("heading")).toHaveTextContent("No findings recorded");
    expect(screen.getByText(/does not confirm/)).toBeVisible();
  });
  it("keeps failed audits distinct even when findings are empty", () => {
    render(<AuditResultSummary job={{ status: "failed", partial: true, findings: [] }} />);
    expect(screen.getByRole("heading")).toHaveTextContent("Audit could not finish");
    expect(screen.getByText(/incomplete/)).toBeVisible();
  });
  it("asks the reader to wait for an active audit", () => {
    render(<AuditResultSummary job={{ status: "running", partial: false, findings: [] }} />);
    expect(screen.getByRole("heading")).toHaveTextContent("Audit in progress");
    expect(screen.getByText(/Wait/)).toBeVisible();
  });
});
