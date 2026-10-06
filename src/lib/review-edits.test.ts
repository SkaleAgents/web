import { expect, it } from "vitest";
import { examples } from "@/components/marketing/example-data";
import { exactLineEdit, reviewCopyText } from "./review-edits";

it("returns a diff for the exact public database line and not a nearby line", () => {
  const edit = exactLineEdit("publicly_accessible = true", "Database publicly accessible");
  expect(edit?.diff).toBe([
    "@@ -1,1 +1,1 @@",
    "-publicly_accessible = true",
    "+publicly_accessible = false",
  ].join("\n"));
  expect(exactLineEdit('publicly_accessible = "true"', "Database publicly accessible")).toBeNull();
  expect(exactLineEdit("publicly_accessible = true # temporary", "Database publicly accessible")).toBeNull();
  expect(examples[0]?.proposal).toBe("publicly_accessible = true becomes publicly_accessible = false");
});

it("copies the top ranked title before the remaining findings", () => {
  const text = reviewCopyText([
    { title: "Minor note", severity: "low", remediation: "Read the note." },
    { title: "Database publicly accessible", severity: "high", remediation: "Disable public access." },
  ], "publicly_accessible = true\n");
  expect(text.startsWith("Database publicly accessible (high)")).toBe(true);
  expect(text).toContain("publicly_accessible = true becomes publicly_accessible = false");
  expect(text).toContain("Disable public access.");
  expect(text).toContain("Minor note");
  expect(text).toContain("Read the note.");
});

it("copies the public database line and the recommended action", () => {
  const text = reviewCopyText([
    { title: "Database publicly accessible", severity: "high", remediation: "Disable public access." },
  ], "publicly_accessible = true\n");
  expect(text).toContain("publicly_accessible = true becomes publicly_accessible = false");
  expect(text).toContain("Disable public access.");
});

it("copies a recommended action without a proposed line when no exact rule matches", () => {
  const text = reviewCopyText([
    { title: "Wildcard IAM permissions", severity: "high", remediation: "Replace the wildcard." },
  ], "actions = [\"*\"]\n");
  expect(text).toContain("Wildcard IAM permissions (high)");
  expect(text).toContain("Replace the wildcard.");
  expect(text).not.toContain("becomes");
});

it("keeps the no-findings copy", () => {
  expect(reviewCopyText([], "publicly_accessible = true\n")).toBe("No findings. That does not prove the system is secure.");
});

it("copies the recommended action for findings below the first three", () => {
  const text = reviewCopyText([
    { title: "Database publicly accessible", severity: "high", remediation: "Disable public access." },
    { title: "Timeout disabled", severity: "medium", remediation: "Set a timeout." },
    { title: "Minor note", severity: "low", remediation: "Look later." },
    { title: "Style note", severity: "info", remediation: "Read the note." },
  ], "publicly_accessible = true\n");
  expect(text).toContain("publicly_accessible = true becomes publicly_accessible = false");
  expect(text.endsWith("Style note\nRead the note.")).toBe(true);
});
