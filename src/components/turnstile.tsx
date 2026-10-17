"use client";

import { useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const turnstileEnabled = Boolean(SITE_KEY);

type TurnstileApi = { render(element: HTMLElement, options: Record<string, unknown>): string; remove(id: string): void };
declare global {
  interface Window { turnstile?: TurnstileApi }
}

let script: Promise<TurnstileApi> | undefined;
function loadTurnstile() {
  script ??= new Promise((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    tag.async = true;
    tag.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile unavailable"));
    tag.onerror = () => { script = undefined; tag.remove(); reject(new Error("Turnstile unavailable")); };
    document.head.append(tag);
  });
  return script;
}

// Tokens are single use. Remount with a new `key` to get a fresh one after each request.
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  const [failed, setFailed] = useState(false);
  useEffect(() => { callback.current = onToken; }, [onToken]);
  useEffect(() => {
    if (!SITE_KEY) return;
    let id: string | undefined;
    let cancelled = false;
    loadTurnstile().then((api) => {
      if (cancelled || !container.current) return;
      id = api.render(container.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => callback.current(token),
        "expired-callback": () => callback.current(""),
        "error-callback": () => callback.current(""),
      });
    }, () => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; if (id) window.turnstile?.remove(id); };
  }, []);
  if (!SITE_KEY) return null;
  if (failed) return <p role="alert" className="text-sm text-danger">Could not load the security check. Reload the page and try again.</p>;
  return <div ref={container} className="min-h-[65px]" />;
}
