import { expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { llmsTxt, markdownDocument } from "./ai-corpus";
import { blogIndexMarkdown, isPostPublished, postMarkdown, publicPosts, publishedPosts } from "./public-posts";
import { publicResources } from "./public-resources";

it("publishes free resources and blog posts in the sitemap, llms.txt, and markdown", async () => {
  expect(new Set(publicResources.map((resource) => resource.slug)).size).toBe(3);
  expect(new Set(publicPosts.map((post) => post.slug)).size).toBe(8);
  expect(publishedPosts(new Date("2026-10-07T12:00:00+06:00"))).toHaveLength(4);
  expect(publishedPosts(new Date("2026-11-09T09:00:00+06:00"))).toHaveLength(8);
  for (const post of publicPosts) {
    if (!post.publishAt) continue;
    expect(post.publishAt).toBe(`${post.date}T09:00:00+06:00`);
    expect(new Date(post.publishAt).getUTCDay()).toBe(1);
  }
  const beforeMemoryLimit = new Date("2026-10-19T08:59:59+06:00");
  const memoryLimitOpens = new Date("2026-10-19T09:00:00+06:00");
  expect(postMarkdown("set-a-memory-limit", beforeMemoryLimit)).toBeNull();
  expect(blogIndexMarkdown(beforeMemoryLimit)).not.toContain("set-a-memory-limit");
  expect(postMarkdown("set-a-memory-limit", memoryLimitOpens)).toContain("mem_limit: 0");
  expect(blogIndexMarkdown(memoryLimitOpens)).toContain("set-a-memory-limit");
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
  expect(urls).toContain("https://skaleagents.com/blog/docker-socket-is-host-root");
  for (const post of publicPosts) {
    const url = `https://skaleagents.com/blog/${post.slug}`;
    if (isPostPublished(post)) expect(urls).toContain(url);
    else expect(urls).not.toContain(url);
  }
  const text = llmsTxt();
  expect(text).toContain("](https://skaleagents.com/resources.md)");
  expect(text).toContain("](https://skaleagents.com/resources/wildcard-iam-review.md)");
  expect(text).toContain("](https://skaleagents.com/blog/hand-a-devops-prompt-to-your-assistant.md)");
  for (const post of publicPosts) {
    const link = `](https://skaleagents.com/blog/${post.slug}.md)`;
    if (isPostPublished(post)) expect(text).toContain(link);
    else expect(text).not.toContain(post.slug);
  }
  const resource = markdownDocument("/resources/container-privilege-review");
  expect(resource).toContain("Docker socket");
  expect(resource).toContain("Review the container spec");
  const post = markdownDocument("/blog/what-a-cloud-review-actually-checks");
  expect(post).toContain("do not log into the account");
  expect(markdownDocument("/resources/missing")).toBeNull();
  expect(markdownDocument("/blog/missing")).toBeNull();
});
