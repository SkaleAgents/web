"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { GoogleSignInLabel } from "./google-mark";
import { GitHubSignInLabel } from "./github-mark";
import { EmailSignInLabel } from "./envelope-mark";
import { API_URL } from "@/lib/api";

const providerClass = "flex w-full items-center justify-center rounded-[10px] border border-line bg-canvas px-3 py-3 text-sm font-semibold hover:bg-accent-soft";
const noop = () => () => {};

export function SignInOptions({ oauth = false, emailPath }: { oauth?: boolean; emailPath: string }) {
  const search = useSyncExternalStore(noop, () => window.location.search, () => "");
  const query = oauth ? "?oauth=1" : "";

  return <div className="space-y-5">
    <h2 className="text-xl font-semibold text-ink">Welcome</h2>
    <div className="space-y-3">
      <a className={providerClass} href={`${API_URL}/api/auth/google/redirect${query}`}><GoogleSignInLabel>Continue with Google</GoogleSignInLabel></a>
      <a className={providerClass} href={`${API_URL}/api/auth/github/redirect${query}`}><GitHubSignInLabel>Continue with GitHub</GitHubSignInLabel></a>
    </div>
    <div className="flex items-center gap-3 text-xs text-ink-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
    <Link className={providerClass} href={`${emailPath}${search}`}><EmailSignInLabel>Continue with email</EmailSignInLabel></Link>
    <p className="text-center text-xs leading-relaxed text-ink-muted">By continuing, you agree to the <Link className="underline underline-offset-4" href="/terms">Terms of Service</Link> and <Link className="underline underline-offset-4" href="/privacy">Privacy Policy</Link>.</p>
  </div>;
}
