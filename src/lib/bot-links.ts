const GROK_URL = "https://grok.com/";
const GROKBOT_URL = "https://x.ai/bot";
const CLAUDE_URL = "https://claude.ai/new";
const CHATGPT_URL = "https://chatgpt.com/";
const CODEX_URL = "https://chatgpt.com/codex";
const PERPLEXITY_URL = "https://www.perplexity.ai/search";
const GEMINI_URL = "https://gemini.google.com/app";

export const ASSISTANT_QUERY_LIMIT = 1800;

export type AssistantId =
  | "claude"
  | "chatgpt"
  | "grok"
  | "supergrok"
  | "codex"
  | "perplexity"
  | "gemini";

export const ASSISTANT_OPTIONS: ReadonlyArray<{
  id: AssistantId;
  label: string;
  description: string;
}> = [
  { id: "claude", label: "Claude", description: "Open a new chat with the prompt" },
  { id: "chatgpt", label: "ChatGPT", description: "Open a new chat with the prompt" },
  { id: "grok", label: "Grok", description: "Open with the prompt prefilled" },
  {
    id: "supergrok",
    label: "Grokbot",
    description: "Copy the prompt, then open Grok Bot",
  },
  { id: "codex", label: "Codex", description: "Open Cloud Codex" },
  { id: "perplexity", label: "Perplexity", description: "Open a search with the prompt" },
  { id: "gemini", label: "Gemini", description: "Copy the prompt, then open Gemini" },
];

const BASE_URL: Record<AssistantId, string> = {
  claude: CLAUDE_URL,
  chatgpt: CHATGPT_URL,
  grok: GROK_URL,
  supergrok: GROKBOT_URL,
  codex: CODEX_URL,
  perplexity: PERPLEXITY_URL,
  gemini: GEMINI_URL,
};

const PREFILL = new Set<AssistantId>([
  "claude",
  "chatgpt",
  "grok",
  "perplexity",
]);

const AGENT_RULES =
  "Follow the instructions below. Use only the context the user provides. If a file, log, or config is missing, ask for it before giving a finding.";

export function plainPromptText(body: string): string {
  return body;
}

export function markdownPromptText(title: string, body: string): string {
  return `# ${title}\n\n${body}`;
}

export function agentPromptText(title: string, body: string): string {
  return [`Task: ${title}`, "", AGENT_RULES, "", "Instructions:", body].join("\n");
}

export type AssistantHandoff =
  | { mode: "prefill"; href: string }
  | { mode: "open"; href: string }
  | { mode: "copy-then-open"; href: string; text: string; notice: string };

export function buildAssistantPromptUrl(
  assistant: AssistantId,
  prompt: string,
): string {
  const url = new URL(BASE_URL[assistant]);
  if (PREFILL.has(assistant)) {
    url.searchParams.set("q", prompt);
  }
  return url.toString();
}

export function buildGrokPromptUrl(prompt: string): string {
  return buildAssistantPromptUrl("grok", prompt);
}

export function assistantHandoff(
  assistant: AssistantId,
  title: string,
  body: string,
): AssistantHandoff {
  if (assistant === "codex") {
    return { mode: "open", href: CODEX_URL };
  }
  if (assistant === "gemini") {
    return {
      mode: "copy-then-open",
      href: GEMINI_URL,
      text: agentPromptText(title, body),
      notice: "Prompt copied. Paste it into Gemini.",
    };
  }
  if (assistant === "supergrok") {
    return {
      mode: "copy-then-open",
      href: GROKBOT_URL,
      text: agentPromptText(title, body),
      notice: "Prompt copied. Paste it into Grok Bot.",
    };
  }
  if (encodeURIComponent(body).length > ASSISTANT_QUERY_LIMIT) {
    return {
      mode: "copy-then-open",
      href: new URL(BASE_URL[assistant]).toString(),
      text: agentPromptText(title, body),
      notice: "Prompt copied. The link was too long to prefill, so paste it into the chat.",
    };
  }
  return { mode: "prefill", href: buildAssistantPromptUrl(assistant, body) };
}
