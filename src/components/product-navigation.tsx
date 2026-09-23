"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const groups = [
  { label: "Explore", items: [
    { href: "/bots", label: "Bot directory", detail: "Find a specialist for your next review.", icon: "bot" },
    { href: "/prompts", label: "Prompt library", detail: "Copy focused instructions into your assistant.", icon: "library" },
  ] },
  { label: "Review", items: [
    { href: "/jobs", label: "Audit jobs", detail: "Review infrastructure with selected specialists.", icon: "audit" },
    { href: "/schedules", label: "Scheduled audits", detail: "Repeat a review and receive webhook alerts.", icon: "calendar" },
  ] },
  { label: "Build & connect", items: [
    { href: "/studio", label: "Creator Studio", detail: "Turn your review process into a reusable bot.", icon: "studio" },
    { href: "/settings", label: "Connect MCP", detail: "Set up your editor and manage API tokens.", icon: "plug" },
  ] },
] as const;

function NavigationIcon({ name }: { name: (typeof groups)[number]["items"][number]["icon"] }) {
  const paths = {
    bot: <><rect x="4" y="7" width="16" height="13" rx="3" /><path d="M12 3v4M8 12v2m8-2v2M9 17h6M1 11v5m22-5v5" /></>,
    library: <><path d="M4 4h6v16H4zM14 4l5-1 3 16-5 1zM4 8h6m-6 8h6m5-8 5-1" /></>,
    audit: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2h6v2M8 12l3 3 5-6" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 2v6m10-6v6M3 10h18m-13 5h2m4 0h2m-8 3h2" /></>,
    studio: <><path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14v6ZM4 20h16" /></>,
    plug: <><path d="M8 2v5m8-5v5M6 7h12v3a6 6 0 0 1-12 0V7Zm6 9v6" /></>,
  };
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function ProductNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const nav = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function cancelClose() {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`) || (href === "/jobs" && pathname.startsWith("/watchtower/"));

  useEffect(() => {
    function dismiss(event: PointerEvent) {
      if (!nav.current?.contains(event.target as Node)) {
        cancelClose();
        setOpen(null);
      }
    }
    document.addEventListener("pointerdown", dismiss);
    return () => {
      cancelClose();
      document.removeEventListener("pointerdown", dismiss);
    };
  }, []);

  return (
    <nav ref={nav} aria-label="Main navigation" className="product-nav" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        cancelClose();
        setOpen(null);
      }
    }} onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        cancelClose();
        nav.current?.querySelector<HTMLButtonElement>(`[aria-expanded="true"]`)?.focus();
        setOpen(null);
      }
    }}>
      {groups.map((group, index) => (
        <div key={group.label} className="product-nav-group" onPointerEnter={(event) => {
          if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover)").matches) return;
          cancelClose();
          setOpen(group.label);
        }} onPointerLeave={(event) => {
          if (event.pointerType !== "mouse") return;
          cancelClose();
          closeTimer.current = setTimeout(() => {
            const panel = nav.current?.querySelector(".product-nav-panel:not([hidden])");
            if (!panel?.contains(document.activeElement)) setOpen(null);
          }, 180);
        }}>
          <button type="button" aria-expanded={open === group.label} aria-controls={`nav-group-${index}`}
            className={`product-nav-trigger ${group.items.some((item) => isActive(item.href)) ? "is-active" : ""}`}
            onClick={(event) => {
              cancelClose();
              // A mouse click after hover keeps the menu open; keyboard and touch toggle it.
              const toggle = event.detail === 0 || !window.matchMedia("(hover: hover) and (pointer: fine)").matches;
              setOpen(toggle && open === group.label ? null : group.label);
            }}>
            <span>{group.label}</span>
            <svg aria-hidden="true" className={`product-nav-chevron ${open === group.label ? "rotate-180" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          <div id={`nav-group-${index}`} hidden={open !== group.label} className="product-nav-panel">
            <p className="marketing-eyebrow px-3 pb-2 pt-1">{group.label} / SkaleAgents</p>
            {group.items.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined}
                className="product-nav-item" onClick={() => { cancelClose(); setOpen(null); }}>
                <span className="product-nav-icon"><NavigationIcon name={item.icon} /></span>
                <span><strong className="block text-sm font-semibold text-ink">{item.label}</strong><span className="mt-1 block text-xs leading-relaxed text-ink-muted">{item.detail}</span></span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
