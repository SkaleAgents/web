"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "./ui";

// An in-app replacement for window.confirm. Esc, Cancel and a backdrop click all cancel; only the confirm button confirms.
export function ConfirmDialog({ open, title, description, confirmLabel, busy = false, onConfirm, onCancel }: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return <dialog ref={dialog} aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}
    onClick={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}
    className="confirm-dialog m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-canvas-elevated p-6 text-ink shadow-2xl sm:p-8">
    <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
    <p className="mt-2 text-sm text-ink-muted">{description}</p>
    <div className="mt-6 flex flex-wrap justify-end gap-3">
      <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>Cancel</Button>
      <Button type="button" variant="secondary" className="!border-danger !text-danger" disabled={busy} onClick={onConfirm}>{busy ? "Working…" : confirmLabel}</Button>
    </div>
  </dialog>;
}
