"use client";

import { useState } from "react";
import { buildGrokPromptUrl } from "@/lib/bot-links";
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
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <a
        className="inline-flex items-center justify-center rounded-[10px] border border-transparent bg-accent px-3 py-2 text-sm font-semibold text-accent-fg hover:brightness-110"
        href={buildGrokPromptUrl(prompt)}
        rel="noopener noreferrer"
        target="_blank"
      >
        Open in Grok
      </a>
      <Button type="button" variant="secondary" onClick={() => void copyPrompt()}>
        {copied ? "Copied" : "Copy prompt"}
      </Button>
      <span className="text-xs text-ink-muted" aria-live="polite">
        {copyFailed
          ? "Copy failed. Select the prompt manually."
          : copied
            ? "Paste it into Codex, Claude, ChatGPT, or another assistant."
            : "Use the prompt with any assistant."}
      </span>
    </div>
  );
}
