"use client";

import { useState } from "react";
import { Button, FieldLabel, TextInput } from "./ui";
import { GoogleSignInLabel } from "./google-mark";
import { API_URL } from "@/lib/api";
import { authPost, authenticationError, completeSignIn, type AuthResult } from "@/lib/email-auth";

type Mode = "signin" | "signup" | "recover";

export function EmailSignIn() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function changeMode(next: Mode) {
    setMode(next); setPassword(""); setSent(false); setError("");
  }

  async function submit() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      if (mode === "signin") {
        completeSignIn(await authPost<AuthResult>("/api/auth/password", { email: email.trim(), password }));
      } else {
        if (mode === "signup") {
          await authPost("/api/auth/register", { email: email.trim(), password, password_confirmation: password });
        } else {
          await authPost("/api/auth/email", { email: email.trim(), purpose: "password" });
        }
        setSent(true);
      }
    } catch (err) { setError(authenticationError(err)); }
    finally { setBusy(false); }
  }

  return <div className="space-y-5">
    <h2 className="text-xl font-semibold text-ink">{sent ? "Check your email" : mode === "signup" ? "Create your account" : mode === "recover" ? "Reset your password" : "Welcome back"}</h2>
    {sent ? <>
      <p role="status" className="text-sm leading-relaxed text-ink-muted">{mode === "signup" ? "We sent account confirmation instructions to " : "We sent a password-reset link to "}<strong className="break-all text-ink">{email.trim()}</strong>. Open the email to continue.</p>
      <Button className="w-full" variant="secondary" disabled={busy} onClick={() => void submit()}>{busy ? "Sending…" : "Resend email"}</Button>
      <Button className="w-full" variant="ghost" disabled={busy} onClick={() => changeMode("signin")}>Back to sign in</Button>
    </> : <>
      {mode !== "recover" && <>
        <a className="flex w-full items-center justify-center rounded-[10px] border border-line bg-canvas px-3 py-3 text-sm font-semibold hover:bg-accent-soft" href={`${API_URL}/api/auth/google/redirect`}>
          <GoogleSignInLabel>Continue with Google</GoogleSignInLabel>
        </a>
        <div className="flex items-center gap-3 text-xs text-ink-muted"><span className="h-px flex-1 bg-line" />or use email<span className="h-px flex-1 bg-line" /></div>
      </>}
      {mode === "recover" && <p className="text-sm text-ink-muted">We&apos;ll email you a link to choose a new password.</p>}
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <fieldset disabled={busy} className="space-y-4">
          <label className="block space-y-1"><FieldLabel>Email</FieldLabel><TextInput type="email" name="email" autoComplete="username" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          {mode !== "recover" && <label className="block space-y-1"><FieldLabel>Password</FieldLabel><TextInput type="password" name="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? 12 : undefined} maxLength={72} placeholder={mode === "signup" ? "At least 12 characters" : undefined} value={password} onChange={(event) => setPassword(event.target.value)} /></label>}
          <Button className="w-full" type="submit">{busy ? "Working…" : mode === "signup" ? "Create account" : mode === "recover" ? "Send reset link" : "Sign in with password"}</Button>
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
