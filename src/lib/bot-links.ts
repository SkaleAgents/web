const GROK_URL = "https://grok.com/";
const CLAUDE_URL = "https://claude.ai/new";
const CODEX_URL = "https://chatgpt.com/codex";

export type AssistantId = "grok" | "supergrok" | "claude" | "codex";

export const ASSISTANT_OPTIONS: ReadonlyArray<{
  id: AssistantId;
  label: string;
  description: string;
}> = [
  { id: "grok", label: "Grok", description: "Open with the prompt prefilled" },
  {
    id: "supergrok",
    label: "SuperGrok",
    description: "Open Grok with your active plan",
  },
  { id: "claude", label: "Claude", description: "Open a new chat with the prompt" },
  { id: "codex", label: "Codex", description: "Open Cloud Codex" },
];

export function buildAssistantPromptUrl(
  assistant: AssistantId,
  prompt: string,
): string {
  const url = new URL(
    assistant === "claude"
      ? CLAUDE_URL
      : assistant === "codex"
        ? CODEX_URL
        : GROK_URL,
  );

  if (assistant !== "codex") {
    url.searchParams.set("q", prompt);
  }

  return url.toString();
}

export function buildGrokPromptUrl(prompt: string): string {
  return buildAssistantPromptUrl("grok", prompt);
}
