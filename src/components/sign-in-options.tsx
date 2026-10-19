"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { GoogleSignInLabel } from "./google-mark";
import { GitHubSignInLabel } from "./github-mark";
import { EmailSignInLabel } from "./envelope-mark";
import { PasskeySignInLabel } from "./key-mark";
import { API_URL } from "@/lib/api";
import { authenticationError, completeSignIn, passkeysSupported, signInWithPasskey } from "@/lib/email-auth";

const providerClass = "flex w-full items-center justify-center rounded-[10px] border border-line bg-canvas px-3 py-3 text-sm font-semibold hover:bg-accent-soft";
const noop = () => () => {};

export function SignInOptions({ oauth = false, emailPath, signup = false, switchable = true }: { oauth?: boolean; emailPath: string; signup?: boolean; switchable?: boolean }) {
  const search = useSyncExternalStore(noop, () => window.location.search, () => "");
  const query = oauth ? "?oauth=1" : "";
  const supportsPasskeys = useSyncExternalStore(noop, passkeysSupported, () => false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");

  async function passkey() {
    setWaiting(true); setError("");
    try { completeSignIn(await signInWithPasskey()); }
    catch (err) { setError(`${authenticationError(err)} You can get a sign-in link by email instead.`); setWaiting(false); }
  }

  return <div className="space-y-5">
    <h2 className="text-xl font-semibold text-ink">{signup ? "Sign up" : "Sign in"}</h2>
    <div className="space-y-3">
      <a className={providerClass} href={`${API_URL}/api/auth/google/redirect${query}`}><GoogleSignInLabel>Continue with Google</GoogleSignInLabel></a>
      <a className={providerClass} href={`${API_URL}/api/auth/github/redirect${query}`}><GitHubSignInLabel>Continue with GitHub</GitHubSignInLabel></a>
    </div>
    <div className="flex items-center gap-3 text-xs text-ink-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
    <Link className={providerClass} href={`${emailPath}${search}`}><EmailSignInLabel>Continue with email</EmailSignInLabel></Link>
    {supportsPasskeys && !signup && <button type="button" className={`${providerClass} disabled:opacity-60`} disabled={waiting} onClick={() => void passkey()}><PasskeySignInLabel>{waiting ? "Waiting for your passkey…" : "Sign in with a passkey"}</PasskeySignInLabel></button>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    {signup && <p className="text-center text-xs leading-relaxed text-ink-muted">By signing up, you agree to the <Link className="underline underline-offset-4" href="/terms">Terms of Service</Link> and <Link className="underline underline-offset-4" href="/privacy">Privacy Policy</Link>.</p>}
    {switchable && <p className="border-t border-line pt-4 text-center text-sm text-ink-muted">{signup ? "Already have an account? " : "New to SkaleAgents? "}<Link className="font-semibold text-ink underline underline-offset-4" href={`${signup ? "/login" : "/signup"}${search}`}>{signup ? "Sign in" : "Create an account"}</Link></p>}
  </div>;
}
