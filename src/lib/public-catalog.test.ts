import { expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import type { Bot, Prompt } from "./api";
import { communityPrompts, countBotsByIntegration, countBotsBySpecialty, loadPublicBot, publishedPublicBots } from "./public-catalog";

const bot = (patch: Partial<Bot>): Bot => ({
  id: "bot",
  ownerUserId: "owner",
  name: "Scout",
  description: "Reviews ingress",
  specialty: "devsecops",
  integrations: [],
  promptBody: "Read the text.",
  visibility: "public",
  status: "published",
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
  ...patch,
});

it("keeps only published public bots and community prompts", () => {
  const bots = publishedPublicBots([
    bot({ id: "public" }),
    bot({ id: "draft", status: "draft" }),
    bot({ id: "private", visibility: "private" }),
  ]);
  expect(bots.map((item) => item.id)).toEqual(["public"]);

  const prompts: Prompt[] = [
    { id: "community", ownerUserId: null, title: "Starter", body: "Look at the input.", tags: ["security"], createdAt: "2026-10-01T00:00:00Z" },
    { id: "personal", ownerUserId: "owner", title: "Mine", body: "Private notes.", tags: [], createdAt: "2026-10-01T00:00:00Z" },
  ];
  expect(communityPrompts(prompts).map((item) => item.id)).toEqual(["community"]);
});

it("counts published public bots for each tool", () => {
  const counts = countBotsByIntegration([
    bot({ id: "github", integrations: ["github", "slack"] }),
    bot({ id: "draft", status: "draft", integrations: ["github"] }),
    bot({ id: "private", visibility: "private", integrations: ["aws"] }),
    bot({ id: "k8s", integrations: ["kubernetes"] }),
  ]);
  expect(counts).toEqual({
    github: 1,
    slack: 1,
    linear: 0,
    terraform: 0,
    aws: 0,
    kubernetes: 1,
  });
});

it("counts published public bots for each specialty", () => {
  const counts = countBotsBySpecialty([
    bot({ id: "one", specialty: "sre" }),
    bot({ id: "two", specialty: "sre" }),
    bot({ id: "three", specialty: "mlops" }),
    bot({ id: "draft", specialty: "devops", status: "draft" }),
  ]);
  expect(counts).toEqual({
    devops: 0,
    devsecops: 0,
    sre: 2,
    mlops: 1,
    scaling: 0,
    general: 0,
  });
});

it("lists a published public bot in the sitemap and leaves private bots out", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/api/prompts")) {
      return Response.json({ prompts: [
        { id: "community-prompt", ownerUserId: null, title: "Starter", body: "Look at the input.", tags: ["security"], createdAt: "2026-10-01T00:00:00Z" },
        { id: "personal-prompt", ownerUserId: "owner", title: "Mine", body: "Private notes.", tags: [], createdAt: "2026-10-01T00:00:00Z" },
      ] });
    }
    return Response.json({ bots: [
      bot({ id: "public-bot" }),
      bot({ id: "private-bot", visibility: "private" }),
    ] });
  };
  try {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain("https://skaleagents.com/bot-directory/public-bot");
    expect(urls).toContain("https://skaleagents.com/bot-directory/integrations");
    expect(urls).toContain("https://skaleagents.com/bot-directory/integrations/github");
    expect(urls).toContain("https://skaleagents.com/bot-directory/specialties");
    expect(urls).toContain("https://skaleagents.com/bot-directory/specialties/mlops");
    expect(urls).toContain("https://skaleagents.com/prompts/community-prompt");
    expect(urls.some((url) => url.includes("private-bot") || url.includes("personal-prompt"))).toBe(false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

it("tells a missing or non-public bot (404 page) apart from an API failure (client retry)", async () => {
  const originalFetch = globalThis.fetch;
  const options: Record<string, RequestInit | undefined> = {};
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    options[url.split("/").pop()!] = init;
    if (url.endsWith("/missing")) return Response.json({ error: "Not found" }, { status: 404 });
    if (url.endsWith("/draft")) return Response.json(bot({ id: "draft", status: "draft" }));
    if (url.endsWith("/down")) return new Response("", { status: 503 });
    return Response.json(bot({ id: "public-bot" }));
  };
  try {
    expect(await loadPublicBot("missing")).toBeNull();
    expect(await loadPublicBot("draft")).toBeNull();
    expect(await loadPublicBot("down")).toBeUndefined();
    expect((await loadPublicBot("public-bot"))?.id).toBe("public-bot");
    // A cached 200 would outlive a deletion, because Next never replaces it with a 404.
    expect(options["missing"]?.cache).toBe("no-store");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
