import { describe, expect, it } from "vitest";
import { DESCRIPTION_MAX, DESCRIPTION_MIN, metaDescription, pageMetadata } from "./page-metadata";
import { publicCheckPath, publicChecks } from "./public-checks";
import { publicResourcePath, publicResources } from "./public-resources";
import { publicPostPath, publicPosts } from "./public-posts";

function expectValid(path: string, title: string, description: string, pad?: string) {
  const meta = pageMetadata({ path, title, description, pad });
  expect(meta.alternates?.canonical).toBe(path);
  expect((meta.openGraph as { url?: string }).url).toBe(path);
  expect((meta.openGraph as { images?: unknown[] }).images?.length).toBeGreaterThan(0);
  expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  const text = meta.description ?? "";
  expect(text.length, `${path}: ${text}`).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
  expect(text.length, `${path}: ${text}`).toBeLessThanOrEqual(DESCRIPTION_MAX);
}

describe("metaDescription", () => {
  it("pads short text and trims long text at a word boundary", () => {
    expect(metaDescription("Terms for using SkaleAgents accounts, plans, and the review product.").length).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
    const long = metaDescription("word ".repeat(80));
    expect(long.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(long.endsWith("...")).toBe(true);
  });
});

describe("pageMetadata for published content", () => {
  it("keeps og:url equal to the canonical with a valid description for every check", () => {
    for (const check of publicChecks) expectValid(publicCheckPath(check), check.title, check.looksFor, `A SkaleAgents ${check.area} review check: the input it needs and what a result does not prove.`);
  });
  it("does the same for every resource", () => {
    for (const resource of publicResources) expectValid(publicResourcePath(resource), resource.title, resource.summary, "A free SkaleAgents checklist and prompt you can copy.");
  });
  it("does the same for every post", () => {
    for (const post of publicPosts) expectValid(publicPostPath(post), post.title, post.description, "A short SkaleAgents note on reviewing infrastructure.");
  });
});
