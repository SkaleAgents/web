import { describe, expect, it } from "vitest";
import type { Bot } from "@/lib/api";
import { relatedReviewers } from "./related-reviewers";

function bot(overrides: Partial<Bot> & Pick<Bot, "id" | "name" | "specialty">): Bot {
  return {
    ownerUserId: "owner",
    description: "Reviews a pasted change.",
    integrations: [],
    promptBody: "Review the pasted change.",
    visibility: "public",
    status: "published",
    createdAt: "2026-10-06T00:00:00Z",
    updatedAt: "2026-10-06T00:00:00Z",
    ...overrides,
  };
}

describe("related reviewers", () => {
  const current = bot({ id: "current", name: "Capacity Reviewer", specialty: "scaling", integrations: ["aws", "kubernetes"] });
  const sameSpecialty = bot({ id: "probe", name: "Probe and limit reviewer", specialty: "scaling", integrations: ["kubernetes"] });
  const sharedTool = bot({ id: "aws", name: "Account boundary reviewer", specialty: "devsecops", integrations: ["aws"] });
  const other = bot({ id: "other", name: "Alpha reviewer", specialty: "devops", integrations: ["github"] });
  const draft = bot({ id: "draft", name: "Draft reviewer", specialty: "scaling", status: "draft" });

  it("prefers the same specialty, then a shared tool", () => {
    const result = relatedReviewers([current, sharedTool, sameSpecialty, other, draft], current);
    expect(result.heading).toBe("Related reviewers");
    expect(result.bots.map((item) => item.id)).toEqual(["probe", "aws"]);
  });

  it("lists other published reviewers when nothing shares a specialty or tool", () => {
    const alone = bot({ id: "workload", name: "AI Workload Reviewer", specialty: "mlops" });
    const result = relatedReviewers([alone, other, sharedTool], alone);
    expect(result.heading).toBe("More reviewers");
    expect(result.bots.map((item) => item.name)).toEqual(["Account boundary reviewer", "Alpha reviewer"]);
  });
});
