"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { GoogleSignInLabel } from "./google-mark";
import { GitHubSignInLabel } from "./github-mark";
import { API_URL } from "@/lib/api";
import { authenticationError, completeSignIn, passkeysSupported, signInWithPasskey } from "@/lib/email-auth";

const providerClass = "flex w-full items-center justify-center rounded-[10px] border border-line bg-canvas px-3 py-3 text-sm font-semibold hover:bg-accent-soft";
const noop = () => () => {};

export function SignInOptions({ oauth = false, emailPath }: { oauth?: boolean; emailPath: string }) {
  const supportsPasskeys = useSyncExternalStore(noop, passkeysSupported, () => false);
  const search = useSyncExternalStore(noop, () => window.location.search, () => "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const query = oauth ? "?oauth=1" : "";

  async function passkey() {
    setBusy(true); setError("");
    try { completeSignIn(await signInWithPasskey()); }
    catch (err) { setError(authenticationError(err)); }
    finally { setBusy(false); }
  }

  return <div className="space-y-5">
    <h2 className="text-xl font-semibold text-ink">Welcome</h2>
    <div className="space-y-3">
      <a className={providerClass} href={`${API_URL}/api/auth/google/redirect${query}`}><GoogleSignInLabel>Continue with Google</GoogleSignInLabel></a>
      <a className={providerClass} href={`${API_URL}/api/auth/github/redirect${query}`}><GitHubSignInLabel>Continue with GitHub</GitHubSignInLabel></a>
    </div>
    {supportsPasskeys && <>
      <div className="flex items-center gap-3 text-xs text-ink-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
      <button type="button" className={`${providerClass} disabled:opacity-60`} disabled={busy} onClick={() => void passkey()}>{busy ? "Waiting for your passkey…" : "Sign in with a passkey"}</button>
    </>}
    <details className="group border-t border-line pt-4">
      <summary className="cursor-pointer list-none text-center text-sm text-ink-muted hover:text-ink">More options <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-180">▾</span></summary>
      <Link className={`${providerClass} mt-4`} href={`${emailPath}${search}`}>Continue with email</Link>
    </details>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <p className="text-center text-xs leading-relaxed text-ink-muted">By continuing, you agree to the <Link className="underline underline-offset-4" href="/terms">Terms of Service</Link> and <Link className="underline underline-offset-4" href="/privacy">Privacy Policy</Link>.</p>
  </div>;
}
