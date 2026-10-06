import { describe, expect, it } from "vitest";
import {
  ASSISTANT_OPTIONS,
  ASSISTANT_QUERY_LIMIT,
  agentPromptText,
  assistantHandoff,
  markdownPromptText,
  plainPromptText,
} from "./bot-links";

const title = "Public exposure review";
const body = "List every resource that accepts traffic from the internet.";

describe("prompt copy text", () => {
  it("copies the body alone, a markdown heading, or an agent handoff", () => {
    expect(plainPromptText(body)).toBe(body);
    expect(markdownPromptText(title, body)).toBe(`# ${title}\n\n${body}`);
    expect(agentPromptText(title, body)).toBe(
      [
        `Task: ${title}`,
        "",
        "Follow the instructions below. Use only the context the user provides. If a file, log, or config is missing, ask for it before giving a finding.",
        "",
        "Instructions:",
        body,
      ].join("\n"),
    );
  });
});

describe("assistant handoff", () => {
  it("lists Claude, ChatGPT, Grok, SuperGrok, Codex, Perplexity, and Gemini", () => {
    expect(ASSISTANT_OPTIONS.map((option) => option.id)).toEqual([
      "claude",
      "chatgpt",
      "grok",
      "supergrok",
      "codex",
      "perplexity",
      "gemini",
    ]);
  });

  it("prefills Claude, ChatGPT, Grok, SuperGrok, and Perplexity", () => {
    for (const id of ["claude", "chatgpt", "grok", "supergrok", "perplexity"] as const) {
      const handoff = assistantHandoff(id, title, body);
      expect(handoff.mode).toBe("prefill");
      if (handoff.mode !== "prefill") continue;
      expect(new URL(handoff.href).searchParams.get("q")).toBe(body);
    }
    expect(assistantHandoff("claude", title, body)).toMatchObject({
      href: expect.stringMatching(/^https:\/\/claude\.ai\/new\?q=/),
    });
    expect(assistantHandoff("chatgpt", title, body)).toMatchObject({
      href: expect.stringMatching(/^https:\/\/chatgpt\.com\/\?q=/),
    });
    expect(assistantHandoff("perplexity", title, body)).toMatchObject({
      href: expect.stringMatching(/^https:\/\/www\.perplexity\.ai\/search\?q=/),
    });
  });

  it("opens Codex without a prefilled prompt", () => {
    expect(assistantHandoff("codex", title, body)).toEqual({
      mode: "open",
      href: "https://chatgpt.com/codex",
    });
  });

  it("copies an agent handoff and opens Gemini without a query", () => {
    expect(assistantHandoff("gemini", title, body)).toEqual({
      mode: "copy-then-open",
      href: "https://gemini.google.com/app",
      text: agentPromptText(title, body),
      notice: "Prompt copied. Paste it into Gemini.",
    });
  });

  it("copies an agent handoff when the encoded prompt is longer than 1800 characters", () => {
    const longBody = "a".repeat(ASSISTANT_QUERY_LIMIT + 1);
    expect(encodeURIComponent(longBody).length).toBeGreaterThan(ASSISTANT_QUERY_LIMIT);
    expect(assistantHandoff("chatgpt", title, longBody)).toEqual({
      mode: "copy-then-open",
      href: "https://chatgpt.com/",
      text: agentPromptText(title, longBody),
      notice: "Prompt copied. The link was too long to prefill, so paste it into the chat.",
    });
    expect(assistantHandoff("codex", title, longBody)).toEqual({
      mode: "open",
      href: "https://chatgpt.com/codex",
    });
  });
});
