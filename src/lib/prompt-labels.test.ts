import { expect, it } from "vitest";
import { promptCategories, promptCategoryLabel, promptType } from "./prompt-labels";

it("labels a community prompt by type and category without treating community as a category", () => {
  expect(promptType(null)).toBe("Community");
  expect(promptType("owner")).toBe("Yours");
  expect(promptCategories(["devsecops", "community"])).toEqual(["Security"]);
  expect(promptCategoryLabel(["sre"])).toBe("Reliability");
  expect(promptCategoryLabel([])).toBe("General");
});
