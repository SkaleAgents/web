"use client";

import { useState } from "react";
import {
  ASSISTANT_OPTIONS,
  buildAssistantPromptUrl,
} from "@/lib/bot-links";
import { Button } from "@/components/ui";

export function BotPromptActions({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  async function copyPrompt() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {ASSISTANT_OPTIONS.map((assistant) => (
        <a
          key={assistant.id}
          className={`inline-flex items-center justify-center rounded-[10px] border px-3 py-2 text-sm font-semibold ${assistant.id === "grok" ? "border-transparent bg-accent text-accent-fg hover:brightness-110" : "border-line bg-transparent text-ink hover:bg-accent-soft"}`}
          href={buildAssistantPromptUrl(assistant.id, prompt)}
          rel="noopener noreferrer"
          target="_blank"
          title={assistant.description}
        >
          Open in {assistant.label}
        </a>
      ))}
      <Button type="button" variant="secondary" onClick={() => void copyPrompt()}>
        Copy prompt
      </Button>
      <span className="pt-2 text-xs text-ink-muted" aria-live="polite">
        {copyFailed
          ? "Copy failed. Select the prompt manually."
          : copied
            ? "Paste it into Codex, Claude, ChatGPT, or another assistant."
            : "Choose an assistant or copy the prompt."}
      </span>
    </div>
  );
}
