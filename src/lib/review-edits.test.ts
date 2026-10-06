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
    { title: "Minor note", severity: "low" },
    { title: "Database publicly accessible", severity: "high" },
  ], "publicly_accessible = true\n");
  expect(text.startsWith("Database publicly accessible (high)")).toBe(true);
  expect(text).toContain("publicly_accessible = true becomes publicly_accessible = false");
  expect(text).toContain("Minor note");
});
