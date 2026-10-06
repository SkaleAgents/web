"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { changePhrase, exactLineEdit } from "@/lib/review-edits";

export function ExactLineChange({ content, title }: { content: string | null; title: string }) {
  const edit = content === null ? null : exactLineEdit(content, title);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  if (!edit) return null;
  const text = changePhrase(edit);
  async function copyChange() {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }
  return <div className="mt-2">
    <pre className="overflow-auto rounded-[10px] border border-line bg-canvas-elevated p-4 font-mono text-sm">{edit.to === null ? `${edit.from}\nremoved` : `${edit.from}\n${edit.to}`}</pre>
    <Button type="button" variant="secondary" className="mt-2" onClick={() => void copyChange()}>Copy change</Button>
    <p className="mt-2 text-sm text-ink-muted" aria-live="polite">{copyState === "copied" ? "Change copied." : copyState === "failed" ? "Clipboard unavailable." : "Copies this line change."}</p>
    {copyState === "failed" && <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-ink-muted">{text}</pre>}
  </div>;
}
