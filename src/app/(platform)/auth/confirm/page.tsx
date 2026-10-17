"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, FieldLabel, LinkButton, TextInput } from "@/components/ui";
import { authPost, authenticationError, completeSignIn, type AuthResult } from "@/lib/email-auth";
import { offerPasskeyAfterSignIn } from "@/components/passkey-prompt";

const subscribe = () => () => {};
const getLink = () => window.__skaleEmailLink ?? null;
const serverLink = () => null;

export default function ConfirmEmailPage() {
  const link = useSyncExternalStore(subscribe, getLink, serverLink);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const details = useQuery({ queryKey: ["email-link-preview"], enabled: !!link, retry: false, gcTime: 0, staleTime: 0,
    queryFn: () => authPost<{ email: string; purpose: string; newAccount: boolean }>("/api/auth/email/inspect", { token: link?.token }),
  });

  const created = details.data?.newAccount;
  return <main className="mx-auto my-12 w-full max-w-md space-y-5 rounded-[10px] border border-line bg-canvas-elevated p-6">
    <h1 className="text-2xl font-semibold">{created ? "Create your account" : created === false ? "Sign in" : "Confirm your email"}</h1>
    {link ? <>
      {details.data && <p className="break-all text-sm">{created ? "Creating an account for " : "Signing in as "}<strong>{details.data.email}</strong></p>}
      {details.isError && <p role="alert" className="text-sm text-danger">{details.error.message}</p>}
      <form className="space-y-4" onSubmit={async (event) => {
        event.preventDefault(); setBusy(true); setError("");
        const data = new FormData(event.currentTarget);
        try {
          const result = await authPost<AuthResult>("/api/auth/email/confirm", { ...link, ...Object.fromEntries(data) });
          offerPasskeyAfterSignIn();
          completeSignIn(result);
        }
        catch (err) { setError(authenticationError(err)); setBusy(false); }
      }}>
        <fieldset disabled={busy || !details.data || details.isError} className="space-y-4">
          {created && <>
            <label className="block space-y-1"><FieldLabel>Your name</FieldLabel><TextInput name="name" autoComplete="name" maxLength={100} /></label>
            <p className="text-xs leading-relaxed text-ink-muted">By creating an account, you agree to the <Link className="underline underline-offset-4" href="/terms">Terms of Service</Link> and <Link className="underline underline-offset-4" href="/privacy">Privacy Policy</Link>.</p>
          </>}
          <Button className="w-full" type="submit">{busy ? "Working…" : created ? "Create account" : "Sign in"}</Button>
        </fieldset>
      </form>
    </> : <p role="status" className="text-sm text-ink-muted">Open the link from your email. If you reloaded this page, reopen that link or request a new one.</p>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <LinkButton href={link?.oauth ? "/login?oauth=1" : "/login"} variant="secondary">Back to sign in</LinkButton>
  </main>;
}
