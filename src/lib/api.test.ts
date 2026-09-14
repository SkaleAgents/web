import { describe, expect, it } from "vitest";
import { SPECIALTIES } from "./api";

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
