"use client";

import { useState } from "react";
import { useEffect, useRef } from "react";
import {
  ASSISTANT_OPTIONS,
  buildAssistantPromptUrl,
} from "@/lib/bot-links";
import { Button } from "@/components/ui";

export function BotPromptActions({ prompt }: { prompt: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function closeOnPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  async function copyPrompt() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setCopyFailed(false);
      setMenuOpen(false);
    } catch {
      setCopied(false);
      setCopyFailed(true);
      setMenuOpen(false);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        type="button"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        Actions <span className="ml-2 text-xs" aria-hidden="true">⌄</span>
      </Button>
      {menuOpen && (
        <div
          className="absolute right-0 top-full z-30 mt-2 min-w-64 overflow-hidden rounded-[10px] border border-line bg-canvas-elevated p-1 shadow-lg"
          role="menu"
        >
          {ASSISTANT_OPTIONS.map((assistant) => (
            <a
              key={assistant.id}
              className="block rounded-md px-3 py-2 text-left hover:bg-accent-soft"
              href={buildAssistantPromptUrl(assistant.id, prompt)}
              rel="noopener noreferrer"
              role="menuitem"
              target="_blank"
              onClick={() => setMenuOpen(false)}
            >
              <span className="block text-sm font-semibold text-ink">
                Open in {assistant.label}
              </span>
              <span className="block text-xs text-ink-muted">
                {assistant.description}
              </span>
            </a>
          ))}
          <button
            className="block w-full rounded-md px-3 py-2 text-left hover:bg-accent-soft"
            role="menuitem"
            type="button"
            onClick={() => void copyPrompt()}
          >
            <span className="block text-sm font-semibold text-ink">
              Copy prompt
            </span>
            <span className="block text-xs text-ink-muted">
              Paste into any other assistant
            </span>
          </button>
        </div>
      )}
      {(copied || copyFailed) && (
        <span
          className="absolute right-0 top-full mt-2 w-max max-w-72 text-right text-xs text-ink-muted"
          aria-live="polite"
        >
          {copyFailed
            ? "Copy failed. Select the prompt manually."
            : "Prompt copied. Paste it into any assistant."}
        </span>
      )}
    </div>
  );
}
