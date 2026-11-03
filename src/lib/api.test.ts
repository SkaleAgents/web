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

describe("apiFetch errors", () => {
  it("carries API blockers and recognises passkey checks", async () => {
    const { apiFetch, ApiError, PasskeyRequiredError, setPasskeyConfirmer } = await import("./api");
    const { vi } = await import("vitest");
    setPasskeyConfirmer(null);
    const respond = (status: number, body: unknown) => vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })));
    respond(409, { message: "Blocked", blockers: ["You own Acme.", 3] });
    const blocked = await apiFetch("/api/account", { method: "DELETE" }).catch((error: unknown) => error);
    expect(blocked).toBeInstanceOf(ApiError);
    expect((blocked as InstanceType<typeof ApiError>).details).toEqual(["You own Acme."]);
    respond(403, { message: "Confirm with your passkey to continue.", code: "passkey_required", hasPasskey: true });
    const passkey = await apiFetch("/api/account", { method: "DELETE" }).catch((error: unknown) => error);
    expect(passkey).toBeInstanceOf(PasskeyRequiredError);
    expect((passkey as InstanceType<typeof PasskeyRequiredError>).hasPasskey).toBe(true);
    vi.unstubAllGlobals();
  });
});

describe("fetchJobPages", () => {
  it("follows nextCursor for the requested pages and keeps the last cursor", async () => {
    const { fetchJobPages } = await import("./api");
    const urls: string[] = [];
    const pages: Record<string, { jobs: { id: string }[]; nextCursor: string | null }> = {
      "/api/jobs": { jobs: [{ id: "a" }], nextCursor: "a" },
      "/api/jobs?before=a": { jobs: [{ id: "b" }], nextCursor: "b" },
    };
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      return Response.json(pages[url.slice(url.indexOf("/api/"))]);
    }) as typeof fetch;
    try {
      expect(await fetchJobPages("/api/jobs", 2)).toEqual({ jobs: [{ id: "a" }, { id: "b" }], nextCursor: "b" });
      expect(urls.map((url) => url.slice(url.indexOf("/api/")))).toEqual(["/api/jobs", "/api/jobs?before=a"]);
    } finally {
      globalThis.fetch = original;
    }
  });
});
