"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui";
import { cookieChoice, saveCookieChoice, subscribeCookieConsent } from "@/lib/cookie-consent";

export const COOKIE_DENIAL_DESTINATION = "https://www.google.com";

export function CookieConsent({ required }: { required: boolean }) {
  const choice = useSyncExternalStore(subscribeCookieConsent, () => cookieChoice() ?? "unset", () => "pending");
  if (!required || choice !== "unset") return null;

  return (
    <section aria-label="Cookie consent" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-canvas-elevated px-4 py-4 shadow-2xl sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-3xl text-sm leading-6 text-ink-muted">
          SkaleAgents uses cookies to keep you signed in and protect forms. Accept to stay here. If you accept, Google Analytics counts page visits, and this browser can remember choices such as postponing a notice. Deny and you will leave for Google. Read the <Link href="/privacy#cookies" className="font-semibold text-ink underline">Privacy Policy</Link>.
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => window.location.assign(COOKIE_DENIAL_DESTINATION)}>Deny</Button>
          <Button type="button" onClick={() => saveCookieChoice("accepted")}>Accept</Button>
        </div>
      </div>
    </section>
  );
}
