"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ASSISTANT_OPTIONS,
  agentPromptText,
  assistantHandoff,
  markdownPromptText,
  plainPromptText,
  type AssistantHandoff,
  type AssistantId,
} from "@/lib/bot-links";

const ASSISTANT_LOGO: Record<AssistantId, string> = {
  claude: "/assistant-logos/claude.svg",
  chatgpt: "/assistant-logos/chatgpt.png",
  grok: "/assistant-logos/grok.png",
  supergrok: "/assistant-logos/grok.png",
  codex: "/assistant-logos/codex.png",
  perplexity: "/assistant-logos/perplexity.svg",
  gemini: "/assistant-logos/gemini.svg",
};

function menuTitle(id: AssistantId, label: string) {
  if (id === "grok" || id === "supergrok") return label;
  return `Open in ${label}`;
}
import { Button } from "@/components/ui";

const COPY_OPTIONS: ReadonlyArray<{
  id: string;
  label: string;
  description: string;
  text: (title: string, body: string) => string;
  notice: string;
}> = [
  {
    id: "plain",
    label: "Copy plain text",
    description: "Prompt body only",
    text: (_title, body) => plainPromptText(body),
    notice: "Prompt copied. Paste it into any assistant.",
  },
  {
    id: "markdown",
    label: "Copy as markdown",
    description: "A heading plus the prompt",
    text: markdownPromptText,
    notice: "Markdown copied. Paste it into any assistant.",
  },
  {
    id: "agent",
    label: "Copy for an agent",
    description: "Title, rules, and the prompt",
    text: agentPromptText,
    notice: "Agent handoff copied. Paste it into any assistant.",
  },
];

export function BotPromptActions({
  prompt,
  title = "Prompt",
  align = "right",
}: {
  prompt: string;
  title?: string;
  align?: "left" | "right";
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const [menuBox, setMenuBox] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    right: number;
    maxHeight: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLSpanElement>(null);

  function measureMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const openUp = below < 320 && above > below;
    return {
      top: openUp ? undefined : rect.bottom + 8,
      bottom: openUp ? window.innerHeight - rect.top + 8 : undefined,
      left: rect.left,
      right: window.innerWidth - rect.right,
      maxHeight: Math.max(160, openUp ? above : below),
    };
  }

  useEffect(() => {
    if (!menuOpen) return;

    function closeOnPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setMenuOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    function placeMenu() {
      const next = measureMenu();
      if (next) setMenuBox(next);
    }

    placeMenu();
    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", placeMenu, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [menuOpen]);

  async function writeClipboard(text: string, success: string) {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setNotice(success);
      setCopyFailed(false);
      setMenuOpen(false);
      return true;
    } catch {
      setNotice(null);
      setCopyFailed(true);
      setMenuOpen(false);
      return false;
    }
  }

  async function openHandoff(handoff: AssistantHandoff) {
    if (handoff.mode === "copy-then-open") {
      const copied = await writeClipboard(handoff.text, handoff.notice);
      if (copied) window.open(handoff.href, "_blank", "noopener,noreferrer");
      return;
    }
    setMenuOpen(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      <span className="inline-flex" ref={buttonRef}>
        <Button
          type="button"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => {
          const next = measureMenu();
          if (next) setMenuBox(next);
          setMenuOpen((open) => !open);
        }}
        >
          Actions
          <svg aria-hidden="true" viewBox="0 0 16 16" className="ml-1.5 h-4 w-4 shrink-0">
            <path d="M4 6.2 8 10l4-3.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>
      </span>
      {menuOpen && menuBox && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[80] min-w-64 overflow-y-auto rounded-[10px] border border-line bg-canvas-elevated p-1 shadow-lg"
          role="menu"
          style={{
            top: menuBox.top,
            bottom: menuBox.bottom,
            maxHeight: menuBox.maxHeight,
            left: align === "left" ? menuBox.left : undefined,
            right: align === "right" ? menuBox.right : undefined,
          }}
        >
          {ASSISTANT_OPTIONS.map((assistant) => {
            const handoff = assistantHandoff(assistant.id, title, prompt);
            const label = (
              <span className="flex items-start gap-2">
                {/* Fixed 16px marks, including SVGs the image optimizer will not process. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ASSISTANT_LOGO[assistant.id]} alt="" width={16} height={16} className="mt-0.5 h-4 w-4 shrink-0 object-contain" />
                <span>
                  <span className="block text-sm font-semibold text-ink">{menuTitle(assistant.id, assistant.label)}</span>
                  <span className="block text-xs text-ink-muted">{assistant.description}</span>
                </span>
              </span>
            );
            if (handoff.mode === "copy-then-open") {
              return (
                <button
                  key={assistant.id}
                  className="block w-full rounded-md px-3 py-2 text-left hover:bg-accent-soft"
                  role="menuitem"
                  type="button"
                  onClick={() => void openHandoff(handoff)}
                >
                  {label}
                </button>
              );
            }
            return (
              <a
                key={assistant.id}
                className="block rounded-md px-3 py-2 text-left hover:bg-accent-soft"
                href={handoff.href}
                rel="noopener noreferrer"
                role="menuitem"
                target="_blank"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            );
          })}
          {COPY_OPTIONS.map((option) => (
            <button
              key={option.id}
              className="block w-full rounded-md px-3 py-2 text-left hover:bg-accent-soft"
              role="menuitem"
              type="button"
              onClick={() => void writeClipboard(option.text(title, prompt), option.notice)}
            >
              <span className="flex items-start gap-2">
                <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0">
                  <rect x="4" y="3.5" width="8" height="9" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M6.5 3.5v-1h3v1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <span>
                  <span className="block text-sm font-semibold text-ink">{option.label}</span>
                  <span className="block text-xs text-ink-muted">{option.description}</span>
                </span>
              </span>
            </button>
          ))}
        </div>,
        document.body,
      )}
      {(notice || copyFailed) && (
        <p className="mt-2 max-w-72 text-xs text-ink-muted" aria-live="polite">
          {copyFailed
            ? "Copy failed. Select the prompt manually."
            : notice}
        </p>
      )}
    </div>
  );
}
