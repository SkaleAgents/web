import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SavedReviewView } from "@/components/saved-review-view";

const review = {
  headline: "New risk since the last review.",
  riskSentence: "Fix these first: Database publicly accessible.",
  findings: [{
    severity: "high",
    title: "Database publicly accessible",
    resource: "aws_db_instance.app",
    path: "infra/main.tf",
    line: 1,
    remediation: "Disable public accessibility.",
  }],
  moreFindings: 2,
  checked: ["DB001"],
  skipped: ["The scanner reported 1 warning."],
};

describe("SavedReviewView", () => {
  it("shows the headline, the change, and what was skipped", () => {
    render(<SavedReviewView review={review} />);

    expect(screen.getByRole("heading", { level: 1, name: "New risk since the last review." })).toBeInTheDocument();
    expect(screen.getByText("Change: Disable public accessibility.")).toBeInTheDocument();
    expect(screen.getByText("The scanner reported 1 warning.")).toBeInTheDocument();
    expect(screen.getByText("2 more findings.")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("ownerUrl");
    expect(document.body.textContent).not.toContain("@");
  });
});
