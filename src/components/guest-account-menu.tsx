"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export function GuestAccountMenu() {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    function dismiss(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  return <div ref={container} className="account-navigation" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }} onKeyDown={event => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    }
  }}>
    <button ref={trigger} type="button" aria-label="Account menu"
      aria-expanded={open} aria-controls={panelId} className="account-nav-trigger"
      onClick={() => setOpen(!open)}>
      <span aria-hidden="true" className="account-nav-avatar">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      </span>
    </button>
    <div id={panelId} hidden={!open} className="account-nav-panel">
      <Link href="/login" className="account-nav-item" onClick={() => setOpen(false)}>Sign in</Link>
    </div>
  </div>;
}
