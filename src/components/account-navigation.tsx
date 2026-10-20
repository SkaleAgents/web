"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { ApiUser } from "@/lib/api";
import { accountLinks } from "@/lib/dashboard-navigation";

export function AccountNavigation({ user, pathname, inquiriesActive = false, signingOut, onSignOut }: {
  user: ApiUser;
  pathname: string;
  inquiriesActive?: boolean;
  signingOut: boolean;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const name = user.displayName.trim() || "Account";
  const parts = name.split(/\s+/);
  const initials = [parts[0], ...(parts.length > 1 ? [parts.at(-1)!] : [])]
    .map((part) => Array.from(part)[0]).join("").toLocaleUpperCase();

  useEffect(() => {
    function dismiss(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  return (
    <div ref={container} className="account-navigation" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }} onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    }}>
      <button ref={trigger} type="button" aria-label={`${name}, account menu`}
        aria-expanded={open} aria-controls={panelId}
        className="account-nav-trigger"
        onClick={() => setOpen(!open)}>
        <span aria-hidden="true" className="account-nav-avatar">{initials}</span>
      </button>
      <div id={panelId} hidden={!open} className="account-nav-panel">
        <div className="mb-1 border-b border-line px-3 pb-3 pt-2">
          <p className="break-words font-semibold text-ink">{name}</p>
          {user.email && <p className="mt-1 break-all text-xs text-ink-muted">{user.email}</p>}
        </div>
        {accountLinks.map(({ href, label }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}
          className="account-nav-item" onClick={() => setOpen(false)}>
          {label}
        </Link>)}
        <div className="my-1 border-t border-line" />
        {user.staffRole === "staff" || user.staffRole === "operator" ? <Link href="/staff/enterprise-inquiries" aria-current={inquiriesActive ? "page" : undefined}
          className="account-nav-item" onClick={() => setOpen(false)}>
          Enterprise inquiries
        </Link> : null}
        <button type="button" className="account-nav-item" disabled={signingOut} onClick={onSignOut}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4H4v16h5m6-12 4 4-4 4M9 12h10" /></svg>
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
