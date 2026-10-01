"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui";
import { cookieChoice, saveCookieChoice, subscribeCookieConsent } from "@/lib/cookie-consent";

export function CookieConsent() {
  const choice = useSyncExternalStore(subscribeCookieConsent, () => cookieChoice() ?? "unset", () => "pending");
  if (choice !== "unset") return null;

  return (
    <section aria-label="Cookie consent" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-canvas-elevated px-4 py-4 shadow-2xl sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-3xl text-sm leading-6 text-ink-muted">
          SkaleAgents uses necessary cookies to keep you signed in and protect forms. Optional cookies remember choices in this browser, such as postponing a notice for 24 hours. Read the <Link href="/privacy#cookies" className="font-semibold text-ink underline">Privacy Policy</Link>.
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => saveCookieChoice("declined")}>Deny</Button>
          <Button type="button" onClick={() => saveCookieChoice("accepted")}>Accept</Button>
        </div>
      </div>
    </section>
  );
}
