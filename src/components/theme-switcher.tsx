"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
const choices = ["light", "dark", "system"] as const;
type Theme = (typeof choices)[number];

function ThemeIcon({ theme }: { theme: Theme }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {theme === "light" ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>
        : theme === "dark" ? <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" />
          : <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></>}
    </svg>
  );
}

export function ThemeSwitcher({ align = "end", side = "bottom" }: {
  align?: "start" | "end";
  side?: "top" | "bottom";
}) {
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const { theme, setTheme } = useTheme();
  const selected: Theme = mounted && (theme === "light" || theme === "dark") ? theme : "system";
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    function dismiss(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <div ref={container} className="relative inline-flex text-sm" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }} onKeyDown={event => {
      if (event.key === "Tab" && open) setOpen(false);
      if (event.key === "Escape" && open) {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    }}>
      <button ref={trigger} type="button" aria-label="Color theme" title="Color theme"
        aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} disabled={!mounted}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait"
        onClick={() => setOpen(!open)} onKeyDown={event => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            menu.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
          }
        }}>
        <ThemeIcon theme={selected} />
      </button>
      {open && <div ref={menu} id={menuId} role="menu" aria-label="Color theme"
        className={`absolute z-50 w-40 rounded-lg border border-line bg-canvas-elevated p-1 shadow-lg ${align === "start" ? "left-0" : "right-0"} ${side === "top" ? "bottom-full mb-2" : "top-full mt-2"}`}
        onKeyDown={event => {
          const items = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []);
          const index = items.indexOf(document.activeElement as HTMLButtonElement);
          const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
            : event.key === "ArrowDown" ? (index + 1) % items.length
              : event.key === "ArrowUp" ? (index + items.length - 1) % items.length : null;
          if (next !== null) {
            event.preventDefault();
            items[next]?.focus();
          }
        }}>
        {choices.map(choice => <button key={choice} type="button" role="menuitemradio"
          aria-checked={selected === choice} tabIndex={-1}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-ink hover:bg-canvas focus:bg-canvas focus:outline-none"
          onClick={() => { setTheme(choice); close(); }}>
          <ThemeIcon theme={choice} />
          <span>{choice[0].toUpperCase() + choice.slice(1)}</span>
          {selected === choice && <svg aria-hidden="true" className="ml-auto text-accent" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>}
        </button>)}
      </div>}
    </div>
  );
}
