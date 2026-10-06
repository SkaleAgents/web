import { expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { llmsTxt, markdownDocument } from "./ai-corpus";
import { publicPosts } from "./public-posts";
import { publicResources } from "./public-resources";

it("publishes free resources and blog posts in the sitemap, llms.txt, and markdown", async () => {
  expect(new Set(publicResources.map((resource) => resource.slug)).size).toBe(3);
  expect(new Set(publicPosts.map((post) => post.slug)).size).toBe(3);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.reject(new Error("offline"));
  let urls: string[] = [];
  try {
    urls = (await sitemap()).map((entry) => entry.url);
  } finally {
    globalThis.fetch = originalFetch;
  }
  expect(urls).toContain("https://skaleagents.com/resources");
  expect(urls).toContain("https://skaleagents.com/resources/public-exposure-review");
  expect(urls).toContain("https://skaleagents.com/blog");
  expect(urls).toContain("https://skaleagents.com/blog/review-terraform-before-you-merge");
  const text = llmsTxt();
  expect(text).toContain("](https://skaleagents.com/resources.md)");
  expect(text).toContain("](https://skaleagents.com/resources/wildcard-iam-review.md)");
  expect(text).toContain("](https://skaleagents.com/blog/hand-a-devops-prompt-to-your-assistant.md)");
  const resource = markdownDocument("/resources/container-privilege-review");
  expect(resource).toContain("Docker socket");
  expect(resource).toContain("Review the container spec");
  const post = markdownDocument("/blog/what-a-cloud-review-actually-checks");
  expect(post).toContain("do not log into the account");
  expect(markdownDocument("/resources/missing")).toBeNull();
  expect(markdownDocument("/blog/missing")).toBeNull();
});
