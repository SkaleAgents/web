"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, FieldLabel, TextInput } from "./ui";
import { Turnstile, turnstileEnabled } from "./turnstile";
import { authPost, authenticationError, completeSignIn, type AuthResult } from "@/lib/email-auth";

type Mode = "signin" | "signup" | "recover";

export function EmailSignIn({ oauth = false }: { oauth?: boolean }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [challenge, setChallenge] = useState(0);
  const verifying = turnstileEnabled && !turnstileToken;

  function changeMode(next: Mode) {
    setMode(next); setPassword(""); setSent(false); setError("");
  }

  async function submit() {
    if (busy || verifying) return;
    setBusy(true); setError("");
    try {
      const mcp = { ...(oauth ? { oauth: true } : {}), ...(turnstileToken ? { turnstileToken } : {}) };
      if (mode === "signin") {
        completeSignIn(await authPost<AuthResult>("/api/auth/password", { email: email.trim(), password, ...mcp }));
      } else {
        if (mode === "signup") {
          await authPost("/api/auth/register", { email: email.trim(), password, password_confirmation: password, ...mcp });
        } else {
          await authPost("/api/auth/email", { email: email.trim(), purpose: "password", ...mcp });
        }
        setSent(true);
      }
    } catch (err) { setError(authenticationError(err)); }
    finally { setBusy(false); setTurnstileToken(""); setChallenge((value) => value + 1); }
  }

  return <div className="space-y-5">
    <h2 className="text-xl font-semibold text-ink">{sent ? "Check your email" : mode === "signup" ? "Create your account" : mode === "recover" ? "Reset your password" : "Welcome back"}</h2>
    {sent ? <>
      <p role="status" className="text-sm leading-relaxed text-ink-muted">{mode === "signup" ? "We sent account confirmation instructions to " : "We sent a password-reset link to "}<strong className="break-all text-ink">{email.trim()}</strong>. Open the email to continue.</p>
      <Turnstile key={challenge} onToken={setTurnstileToken} />
      <Button className="w-full" variant="secondary" disabled={busy || verifying} onClick={() => void submit()}>{busy ? "Sending…" : "Resend email"}</Button>
      <Button className="w-full" variant="ghost" disabled={busy} onClick={() => changeMode("signin")}>Back to sign in</Button>
    </> : <>
      {mode === "recover" && <p className="text-sm text-ink-muted">We&apos;ll email you a link to choose a new password.</p>}
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <fieldset disabled={busy} className="space-y-4">
          <label className="block space-y-1"><FieldLabel>Email</FieldLabel><TextInput type="email" name="email" autoComplete="username" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          {mode !== "recover" && <label className="block space-y-1"><FieldLabel>Password</FieldLabel><TextInput type="password" name="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? 12 : undefined} maxLength={72} placeholder={mode === "signup" ? "At least 12 characters" : undefined} value={password} onChange={(event) => setPassword(event.target.value)} /></label>}
          <Turnstile key={challenge} onToken={setTurnstileToken} />
          {mode === "signup" && <p className="text-xs leading-relaxed text-ink-muted">By creating an account, you agree to the <Link className="underline underline-offset-4" href="/terms">Terms of Service</Link> and <Link className="underline underline-offset-4" href="/privacy">Privacy Policy</Link>.</p>}
          <Button className="w-full" type="submit" disabled={verifying}>{busy ? "Working…" : mode === "signup" ? "Create account" : mode === "recover" ? "Send reset link" : "Sign in with password"}</Button>
          {mode === "signin" && <button className="block w-full text-center text-sm text-ink-muted hover:text-ink disabled:opacity-60" type="button" onClick={() => changeMode("recover")}>Forgot password?</button>}
        </fieldset>
      </form>
      <div className="border-t border-line pt-4 text-center">
        <Button variant="ghost" type="button" disabled={busy} onClick={() => changeMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Create an account" : "Back to sign in"}</Button>
      </div>
    </>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
  </div>;
}
