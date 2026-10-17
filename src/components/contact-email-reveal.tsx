"use client";

import { useId, useRef, useState } from "react";
import { Button } from "./ui";
import { Turnstile, turnstileEnabled } from "./turnstile";
import { authPost } from "@/lib/email-auth";

// The address is fetched after a Turnstile check so it never appears in page HTML for scrapers.
export function ContactEmailReveal() {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState(0);

  async function reveal(turnstileToken: string) {
    if (!turnstileToken || busy) return;
    setBusy(true); setError("");
    try { setEmail((await authPost<{ email: string }>("/api/contact/email", { turnstileToken })).email); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not load the email address. Try again."); setChallenge((value) => value + 1); }
    finally { setBusy(false); }
  }

  function open() {
    dialog.current?.showModal();
    if (!turnstileEnabled && !email) void reveal("development");
  }

  return <>
    <Button type="button" className="mt-2 min-h-11 px-6" aria-haspopup="dialog" onClick={open}>Show email address</Button>
    <dialog ref={dialog} aria-labelledby={titleId} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-canvas-elevated p-6 text-ink shadow-2xl sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <h2 id={titleId} className="font-display text-2xl font-semibold tracking-tight">Email SkaleAgents</h2>
        <Button type="button" variant="ghost" onClick={() => dialog.current?.close()} aria-label="Close" className="size-9 p-0 text-xl">×</Button>
      </div>
      {email ? <div className="mt-5 space-y-4">
        <a className="block w-fit break-all font-display text-xl font-semibold underline decoration-accent underline-offset-8" href={`mailto:${email}`}>{email}</a>
        <div className="flex flex-wrap gap-2">
          <a className="inline-flex min-h-11 items-center bg-accent px-5 text-sm font-semibold text-accent-fg hover:opacity-90" href={`mailto:${email}`}>Open email app</a>
          <Button type="button" variant="secondary" onClick={() => void navigator.clipboard?.writeText(email)}>Copy address</Button>
        </div>
      </div> : <div className="mt-5 space-y-4">
        <p className="text-sm text-ink-muted">Complete this quick check to see our email address.</p>
        <Turnstile key={challenge} onToken={(token) => void reveal(token)} />
        {busy && <p role="status" className="text-sm text-ink-muted">Loading…</p>}
      </div>}
      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
    </dialog>
  </>;
}
