"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Button, FieldLabel, TextInput } from "./ui";
import { Turnstile, turnstileEnabled } from "./turnstile";
import { authPost, authenticationError, completeSignIn, passkeysSupported, signInWithPasskey } from "@/lib/email-auth";

const noop = () => () => {};

// Passkey first for returning users; the emailed sign-in link creates new accounts and is the fallback.
export function EmailSignIn({ oauth = false }: { oauth?: boolean }) {
  const supportsPasskeys = useSyncExternalStore(noop, passkeysSupported, () => false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"" | "passkey" | "email">("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [challenge, setChallenge] = useState(0);
  const verifying = turnstileEnabled && !turnstileToken;

  async function passkey() {
    setBusy("passkey"); setError("");
    try { completeSignIn(await signInWithPasskey()); }
    catch (err) { setError(`${authenticationError(err)} You can get a sign-in link by email instead.`); setBusy(""); }
  }

  async function sendLink() {
    if (busy || verifying) return;
    setBusy("email"); setError("");
    try {
      await authPost("/api/auth/email", { email: email.trim(), purpose: "signin", ...(oauth ? { oauth: true } : {}), ...(turnstileToken ? { turnstileToken } : {}) });
      setSent(true);
    } catch (err) { setError(authenticationError(err)); }
    finally { setBusy(""); setTurnstileToken(""); setChallenge((value) => value + 1); }
  }

  return <div className="space-y-5">
    <h2 className="text-xl font-semibold text-ink">{sent ? "Check your email" : "Continue with email"}</h2>
    {sent ? <>
      <p role="status" className="text-sm leading-relaxed text-ink-muted">We sent a sign-in link to <strong className="break-all text-ink">{email.trim()}</strong>. It works once and expires in 15 minutes.</p>
      <Turnstile key={challenge} onToken={setTurnstileToken} />
      <Button className="w-full" variant="secondary" disabled={!!busy || verifying} onClick={() => void sendLink()}>{busy ? "Sending…" : "Resend email"}</Button>
      <Button className="w-full" variant="ghost" disabled={!!busy} onClick={() => { setSent(false); setError(""); }}>Use a different email</Button>
    </> : <>
      {supportsPasskeys && <>
        <Button className="w-full" disabled={!!busy} onClick={() => void passkey()}>{busy === "passkey" ? "Waiting for your passkey…" : "Sign in with a passkey"}</Button>
        <div className="flex items-center gap-3 text-xs text-ink-muted"><span className="h-px flex-1 bg-line" />or get a link by email<span className="h-px flex-1 bg-line" /></div>
      </>}
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void sendLink(); }}>
        <fieldset disabled={!!busy} className="space-y-4">
          <label className="block space-y-1"><FieldLabel>Email</FieldLabel><TextInput type="email" name="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <Turnstile key={challenge} onToken={setTurnstileToken} />
          <Button className="w-full" type="submit" variant={supportsPasskeys ? "secondary" : undefined} disabled={verifying}>{busy === "email" ? "Sending…" : "Email me a sign-in link"}</Button>
          <p className="text-xs leading-relaxed text-ink-muted">New here? The link creates your account. By continuing, you agree to the <Link className="underline underline-offset-4" href="/terms">Terms of Service</Link> and <Link className="underline underline-offset-4" href="/privacy">Privacy Policy</Link>.</p>
        </fieldset>
      </form>
    </>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
  </div>;
}
