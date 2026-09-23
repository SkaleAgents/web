"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const groups = [
  { label: "Explore", items: [
    { href: "/bots", label: "Bot directory", detail: "Find a specialist for your next review.", mark: "01" },
    { href: "/prompts", label: "Prompt library", detail: "Copy focused instructions into your assistant.", mark: "02" },
  ] },
  { label: "Review", items: [
    { href: "/jobs", label: "Audit jobs", detail: "Review infrastructure with selected specialists.", mark: "03" },
    { href: "/schedules", label: "Scheduled audits", detail: "Repeat a review and receive webhook alerts.", mark: "04" },
  ] },
  { label: "Build & connect", items: [
    { href: "/studio", label: "Creator Studio", detail: "Turn your review process into a reusable bot.", mark: "05" },
    { href: "/settings", label: "Connect MCP", detail: "Set up your editor and manage API tokens.", mark: "06" },
  ] },
];

export function ProductNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const nav = useRef<HTMLElement>(null);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`) || (href === "/jobs" && pathname.startsWith("/watchtower/"));

  useEffect(() => {
    function dismiss(event: PointerEvent) {
      if (!nav.current?.contains(event.target as Node)) setOpen(null);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  return (
    <nav ref={nav} aria-label="Main navigation" className="product-nav" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(null);
    }} onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        nav.current?.querySelector<HTMLButtonElement>(`[aria-expanded="true"]`)?.focus();
        setOpen(null);
      }
    }}>
      {groups.map((group, index) => (
        <div key={group.label} className="product-nav-group">
          <button type="button" aria-expanded={open === group.label} aria-controls={`nav-group-${index}`}
            className={`product-nav-trigger ${group.items.some((item) => isActive(item.href)) ? "is-active" : ""}`}
            onClick={() => setOpen(open === group.label ? null : group.label)}>
            {group.label}<span aria-hidden="true" className={open === group.label ? "rotate-180" : ""}>⌄</span>
          </button>
          <div id={`nav-group-${index}`} hidden={open !== group.label} className="product-nav-panel">
            <p className="marketing-eyebrow px-3 pb-2 pt-1">{group.label} / SkaleAgents</p>
            {group.items.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined}
                className="product-nav-item" onClick={() => setOpen(null)}>
                <span className="font-mono text-xs text-accent" aria-hidden="true">{item.mark}</span>
                <span><strong className="block text-sm font-semibold text-ink">{item.label}</strong><span className="mt-1 block text-xs leading-relaxed text-ink-muted">{item.detail}</span></span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
