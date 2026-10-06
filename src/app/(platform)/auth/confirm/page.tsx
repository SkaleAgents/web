"use client";

import { useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, FieldLabel, LinkButton, TextInput } from "@/components/ui";
import { authPost, authenticationError, completeSignIn, type AuthResult } from "@/lib/email-auth";

const subscribe = () => () => {};
const getLink = () => window.__skaleEmailLink ?? null;
const serverLink = () => null;

export default function ConfirmEmailPage() {
  const link = useSyncExternalStore(subscribe, getLink, serverLink);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const details = useQuery({ queryKey: ["email-link-preview"], enabled: !!link, retry: false, gcTime: 0, staleTime: 0,
    queryFn: () => authPost<{ email: string; purpose: string; requiresPassword?: boolean }>("/api/auth/email/inspect", { token: link?.token }),
  });

  return <main className="mx-auto my-12 w-full max-w-md space-y-5 rounded-[10px] border border-line bg-canvas-elevated p-6">
    <h1 className="text-2xl font-semibold">{link?.purpose === "register" ? "Confirm your email" : link?.purpose === "password" ? "Set your password" : "Confirm email sign-in"}</h1>
    {link ? <>
      {details.data && <p className="break-all text-sm">Sign in as <strong>{details.data.email}</strong></p>}
      {details.isError && <p role="alert" className="text-sm text-danger">{details.error.message}</p>}
      <p className="text-sm text-ink-muted">{link.purpose === "register" ? details.data?.requiresPassword ? "You opened this link in a different browser. Enter the password you chose when signing up to finish." : "Your password is already set. Confirm your email to finish signing up." : link.purpose === "password" ? "Choose at least 12 characters. Saving signs out your other sessions and disconnects existing API and MCP tokens. Your registered passkeys still work." : "Continue to sign in or create your account using the email that received this link."}</p>
      <form className="space-y-4" onSubmit={async (event) => {
        event.preventDefault(); setBusy(true); setError("");
        const data = new FormData(event.currentTarget);
        try { completeSignIn(await authPost<AuthResult>("/api/auth/email/confirm", { ...link, ...Object.fromEntries(data) })); }
        catch (err) { setError(authenticationError(err)); setBusy(false); }
      }}>
        <fieldset disabled={busy || !details.data || details.isError} className="space-y-4">
          {link.purpose === "signin" && <label className="block space-y-1"><FieldLabel>Name (new accounts only)</FieldLabel><TextInput name="name" autoComplete="name" maxLength={100} /></label>}
          {link.purpose === "register" && details.data?.requiresPassword && <>
            <input type="hidden" name="email" autoComplete="username" value={details.data.email} />
            <label className="block space-y-1"><FieldLabel>Password</FieldLabel><TextInput name="password" type="password" autoComplete="current-password" required maxLength={72} /></label>
          </>}
          {link.purpose === "password" && <>
            <label className="block space-y-1"><FieldLabel>New password</FieldLabel><TextInput name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={72} /></label>
            <label className="block space-y-1"><FieldLabel>Confirm password</FieldLabel><TextInput name="password_confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={72} /></label>
          </>}
          <Button className="w-full" type="submit">{busy ? "Signing in…" : link.purpose === "password" ? "Save password and sign in" : link.purpose === "register" ? "Confirm email and sign in" : "Confirm and sign in"}</Button>
        </fieldset>
      </form>
    </> : <p role="status" className="text-sm text-ink-muted">Open the link from your email. If you reloaded this page, reopen that link or request a new one.</p>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <LinkButton href={link?.oauth ? "/login?oauth=1" : "/login"} variant="secondary">Back to sign in</LinkButton>
  </main>;
}
