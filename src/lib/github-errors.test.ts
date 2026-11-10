import { describe, expect, it } from "vitest";
import { ApiError } from "./api";
import { githubErrorMessage, needsUpgrade } from "./github";

describe("a 429 from the API", () => {
  it("means the audits are used up only when it says so, and then offers Upgrade", () => {
    const allowance = new ApiError("Your plan's audit allowance is used up.", 429, [], "audit_limit_reached");
    expect(githubErrorMessage(allowance)).toBe("You've used all your audits this period.");
    expect(needsUpgrade(allowance)).toBe(true);
  });

  it("is a rate limit when it carries no code, so it keeps its message and offers no Upgrade", () => {
    const rate = new ApiError("You're going a little fast. Wait a moment and try again.", 429);
    expect(githubErrorMessage(rate)).toBe("You're going a little fast. Wait a moment and try again.");
    expect(needsUpgrade(rate)).toBe(false);
  });

  it("still offers Upgrade for a plan that does not include GitHub", () => {
    expect(needsUpgrade(new ApiError("Premium required", 403, [], "premium_required"))).toBe(true);
  });
});
