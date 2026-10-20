"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, FieldLabel, TextInput } from "./ui";
import { Turnstile, turnstileEnabled } from "./turnstile";
import { authPost, authenticationError } from "@/lib/email-auth";

// Emails a one-time link: it signs in an existing account or creates a new one. Passkey sign-in lives on the sign-in options page.
export function EmailSignIn({ oauth = false, signup = false }: { oauth?: boolean; signup?: boolean }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [challenge, setChallenge] = useState(0);
  const verifying = turnstileEnabled && !turnstileToken;

  async function sendLink() {
    if (busy || verifying) return;
    setBusy(true); setError("");
    try {
      await authPost("/api/auth/email", { email: email.trim(), purpose: "signin", ...(signup ? { name: name.trim() } : {}), ...(oauth ? { oauth: true } : {}), ...(turnstileToken ? { turnstileToken } : {}) });
      setSent(true);
    } catch (err) { setError(authenticationError(err)); }
    finally { setBusy(false); setTurnstileToken(""); setChallenge((value) => value + 1); }
  }

  return <div className="space-y-5">
    <h2 className="text-xl font-semibold text-ink">{sent ? "Check your email" : signup ? "Sign up with email" : "Sign in with email"}</h2>
    {sent ? <>
      <p role="status" className="text-sm leading-relaxed text-ink-muted">We sent a {signup ? "sign-up" : "sign-in"} link to <strong className="break-all text-ink">{email.trim()}</strong>. It works once and expires in 15 minutes.</p>
      <Turnstile key={challenge} onToken={setTurnstileToken} />
      <Button className="w-full" variant="secondary" disabled={busy || verifying} onClick={() => void sendLink()}>{busy ? "Sending…" : "Resend email"}</Button>
      <Button className="w-full" variant="ghost" disabled={busy} onClick={() => { setSent(false); setError(""); }}>Use a different email</Button>
    </> : <>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void sendLink(); }}>
        <fieldset disabled={busy} className="space-y-4">
          {signup && <label className="block space-y-1"><FieldLabel>Full name</FieldLabel><TextInput name="name" autoComplete="name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label>}
          <label className="block space-y-1"><FieldLabel>Email</FieldLabel><TextInput type="email" name="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <Turnstile key={challenge} onToken={setTurnstileToken} />
          <Button className="w-full" type="submit" disabled={verifying}>{busy ? "Sending…" : signup ? "Email me a sign-up link" : "Email me a sign-in link"}</Button>
          {signup && <p className="text-xs leading-relaxed text-ink-muted">By signing up, you agree to the <Link className="underline underline-offset-4" href="/terms">Terms of Service</Link> and <Link className="underline underline-offset-4" href="/privacy">Privacy Policy</Link>.</p>}
        </fieldset>
      </form>
    </>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
  </div>;
}
