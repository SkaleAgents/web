"use client";

import { useEffect, useRef, useState } from "react";
import { Button, FieldLabel, TextInput } from "./ui";
import { GoogleSignInLabel } from "./google-mark";
import { API_URL } from "@/lib/api";
import { authPost, authenticationError, completeSignIn, signInWithPasskey, type AuthResult } from "@/lib/email-auth";

export function EmailSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState<"email" | "method">("email");
  const [method, setMethod] = useState<"password" | "passkey">("password");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const passwordInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "method" && method === "password" && mode === "signin") passwordInput.current?.focus();
  }, [step, method, mode]);

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
    <h2 className="text-xl font-semibold text-ink">{step === "email" ? "Welcome back" : mode === "signup" ? "Create your account" : "Sign in with email"}</h2>
    {step === "email" ? <>
      <a className="flex w-full items-center justify-center rounded-[10px] border border-line bg-canvas px-3 py-3 text-sm font-semibold hover:bg-accent-soft" href={`${API_URL}/api/auth/google/redirect`}>
        <GoogleSignInLabel>Continue with Google</GoogleSignInLabel>
      </a>
      <div className="flex items-center gap-3 text-xs text-ink-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setEmail(email.trim()); setStep("method"); setError(""); setMessage(""); }}>
        <label className="block space-y-1"><FieldLabel>Email</FieldLabel><TextInput type="email" name="email" autoComplete="username" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <Button className="w-full" type="submit">Next</Button>
      </form>
    </> : <>
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="min-w-0 break-all text-ink-muted">{email}</p>
        <Button variant="ghost" type="button" className="shrink-0 px-0" disabled={busy !== null} aria-label="Change email" onClick={() => { setStep("email"); setPassword(""); setError(""); setMessage(""); }}>Change</Button>
      </div>
      <form className="space-y-4" onSubmit={(event) => {
        event.preventDefault();
        void submit(mode === "signup" ? method === "password" ? "setup" : "signin" : method);
      }}>
        <fieldset disabled={busy !== null} className="space-y-4">
          <div role="group" aria-label="Sign-in method" className="grid grid-cols-2 gap-1 rounded-[10px] border border-line p-1">
            {([['password', 'Password'], ['passkey', 'Touch ID / Face ID']] as const).map(([value, label]) => <button
              key={value} type="button" aria-pressed={method === value}
              className={`min-h-11 rounded-[7px] px-2 py-2 text-sm font-semibold leading-snug disabled:opacity-60 ${method === value ? "bg-accent-soft text-ink" : "text-ink-muted hover:text-ink"}`}
              onClick={() => { setMethod(value); setPassword(""); setError(""); setMessage(""); }}
            >{label}</button>)}
          </div>
          <input type="hidden" name="email" autoComplete="username" value={email} />
          {mode === "signup" ? <p className="text-sm text-ink-muted">{method === "password" ? "Verify your email, then set your password." : "Verify your email, then add a passkey in Settings."}</p> : method === "password" ?
            <label className="block space-y-1"><FieldLabel>Password</FieldLabel><TextInput ref={passwordInput} type="password" name="password" autoComplete="current-password" required maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} /></label> :
            <p className="text-sm text-ink-muted">Use a saved passkey with your fingerprint, face, or device screen lock.</p>}
          <Button className="w-full" type="submit">{busy ? "Working…" : mode === "signup" ? method === "password" ? "Verify email to set a password" : "Verify email to add a passkey" : method === "password" ? "Sign in with password" : "Use Touch ID / Face ID"}</Button>
          {mode === "signin" && method === "password" && <button className="block w-full text-center text-sm text-ink-muted hover:text-ink disabled:opacity-60" type="button" onClick={() => void submit("setup")}>Forgot password?</button>}
          <button className="block w-full text-center text-sm text-ink-muted hover:text-ink disabled:opacity-60" type="button" onClick={() => void submit("signin")}>{busy === "signin" ? "Sending…" : "Email me a magic link"}</button>
        </fieldset>
      </form>
      <div className="border-t border-line pt-4 text-center">
        <Button variant="ghost" type="button" disabled={busy !== null} onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); setPassword(""); }}>{mode === "signin" ? "Create an account" : "Already have an account? Sign in"}</Button>
      </div>
    </>}
    {message && <p role="status" className="rounded-lg border border-line p-3 text-sm text-ink">{message}</p>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
  </div>;
}
