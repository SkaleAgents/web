"use client";

import { useState } from "react";
import { Button, FieldLabel, TextInput } from "./ui";
import { API_URL } from "@/lib/api";
import { authPost, authenticationError, completeSignIn, signInWithPasskey, type AuthResult } from "@/lib/email-auth";

export function EmailSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(method: "password" | "passkey" | "signin" | "setup") {
    setBusy(method); setMessage(""); setError("");
    try {
      if (method === "password") completeSignIn(await authPost<AuthResult>("/api/auth/password", { email, password }));
      else if (method === "passkey") completeSignIn(await signInWithPasskey(email));
      else {
        const result = await authPost<{ message: string }>("/api/auth/email", { email, purpose: method === "setup" ? "password" : "signin" });
        setMessage(result.message);
      }
    } catch (err) { setError(authenticationError(err)); }
    finally { setBusy(null); }
  }

  return <div className="space-y-5">
    <div>
      <h2 className="text-xl font-semibold text-ink">{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
      <p className="mt-2 text-sm text-ink-muted">{mode === "signup" ? "Verify your email, then choose a password or add a passkey." : "Use your email and choose how to sign in."}</p>
    </div>
    <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submit(mode === "signup" ? "setup" : "password"); }}>
      <fieldset disabled={busy !== null} className="space-y-4">
        <label className="block space-y-1"><FieldLabel>Email</FieldLabel><TextInput type="email" name="email" autoComplete="username webauthn" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        {mode === "signin" && <label className="block space-y-1"><FieldLabel>Password</FieldLabel><TextInput type="password" name="password" autoComplete="current-password" required maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} /></label>}
        <Button className="w-full" type="submit">{busy === "password" || busy === "setup" ? "Working…" : mode === "signup" ? "Verify email to set a password" : "Sign in with password"}</Button>
        <Button className="w-full" variant="secondary" type="button" onClick={(event) => { const form = event.currentTarget.form!; if ((form.elements.namedItem("email") as HTMLInputElement).reportValidity()) void submit("passkey"); }}>Use Touch ID / Face ID</Button>
        <p className="text-xs text-ink-muted">Use a saved passkey with your device&apos;s fingerprint, face, or screen lock. New here? Verify your email first, then add a passkey in Settings.</p>
        <Button className="w-full" variant="secondary" type="button" onClick={(event) => { if ((event.currentTarget.form!.elements.namedItem("email") as HTMLInputElement).reportValidity()) void submit("signin"); }}>{busy === "signin" ? "Sending…" : "Email me a magic link"}</Button>
        {mode === "signin" && <Button variant="ghost" type="button" onClick={(event) => { if ((event.currentTarget.form!.elements.namedItem("email") as HTMLInputElement).reportValidity()) void submit("setup"); }}>Forgot password or need to set one?</Button>}
      </fieldset>
    </form>
    {message && <p role="status" className="rounded-lg border border-line p-3 text-sm text-ink">{message}</p>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <div className="border-t border-line pt-4 text-center">
      <a className="block rounded-[10px] border border-line px-3 py-2 text-sm font-semibold hover:bg-accent-soft" href={`${API_URL}/api/auth/google/redirect`}>Continue with Google</a>
      <Button variant="ghost" type="button" disabled={busy !== null} className="mt-2" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); setPassword(""); }}>{mode === "signin" ? "Create an account" : "Already have an account? Sign in"}</Button>
    </div>
  </div>;
}
