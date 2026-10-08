import { describe, expect, it } from "vitest";
import { BOT_INTEGRATION_SLUGS, SPECIALTIES } from "./api";

describe("SPECIALTIES", () => {
  it("matches OpenAPI specialty enum", () => {
    expect(SPECIALTIES).toEqual([
      "devops",
      "devsecops",
      "sre",
      "mlops",
      "scaling",
      "general",
    ]);
  });
});

describe("BOT_INTEGRATION_SLUGS", () => {
  it("matches the OpenAPI integration enum", () => {
    expect(BOT_INTEGRATION_SLUGS).toEqual([
      "github",
      "slack",
      "linear",
      "terraform",
      "aws",
      "kubernetes",
    ]);
  });
});

describe("parsePromptTags", () => {
  it("splits and trims comma-separated tags", async () => {
    const { parsePromptTags } = await import("./tags");
    expect(parsePromptTags(" sre , ops, ,devops ")).toEqual([
      "sre",
      "ops",
      "devops",
    ]);
  });
});

describe("buildGrokPromptUrl", () => {
  it("encodes the bot prompt in the Grok handoff URL", async () => {
    const { buildGrokPromptUrl } = await import("./bot-links");
    const prompt = "Review secure defaults.\nExplain the highest-impact fix.";
    const url = new URL(buildGrokPromptUrl(prompt));

    expect(url.origin).toBe("https://grok.com");
    expect(url.pathname).toBe("/");
    expect(url.searchParams.get("q")).toBe(prompt);
  });
});

describe("buildAssistantPromptUrl", () => {
  it("keeps provider options in the directory action order", async () => {
    const { ASSISTANT_OPTIONS, buildAssistantPromptUrl } = await import("./bot-links");
    const prompt = "Review the deployment and explain the safest next step.";

    expect(ASSISTANT_OPTIONS.map((option) => option.label)).toEqual([
      "Claude",
      "ChatGPT",
      "Grok",
      "Grokbot",
      "Codex",
      "Perplexity",
      "Gemini",
    ]);
    expect(new URL(buildAssistantPromptUrl("grok", prompt)).searchParams.get("q")).toBe(prompt);
    expect(buildAssistantPromptUrl("supergrok", prompt)).toBe("https://x.ai/bot");
    expect(new URL(buildAssistantPromptUrl("claude", prompt)).searchParams.get("q")).toBe(prompt);
    expect(buildAssistantPromptUrl("codex", prompt)).toBe("https://chatgpt.com/codex");
  });
});
