"use client";

import { useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, FieldLabel, LinkButton, TextInput } from "@/components/ui";
import { AccountSetupChoices, finishAccountSetup, passkeyNameFrom, usePasskeySupport } from "@/components/account-setup";
import { agreementDestination } from "@/lib/account-agreement";
import { API_URL, apiFetch } from "@/lib/api";
import { authPost, authenticationError, completeSignIn, type AuthResult } from "@/lib/email-auth";
import { offerPasskeyAfterSignIn } from "@/components/passkey-prompt";

const subscribe = () => () => {};
const getLink = () => window.__skaleEmailLink ?? null;
const serverLink = () => null;

export default function ConfirmEmailPage() {
  const link = useSyncExternalStore(subscribe, getLink, serverLink);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [passkey, setPasskey] = useState(true);
  const [agreed, setAgreed] = useState(false);
  // The link is single-use, so after it signs in we keep the account and only retry the setup.
  const [accountId, setAccountId] = useState("");
  const supportsPasskeys = usePasskeySupport();
  const details = useQuery({ queryKey: ["email-link-preview"], enabled: !!link, retry: false, gcTime: 0, staleTime: 0,
    queryFn: () => authPost<{ email: string; purpose: string; name?: string | null; newAccount: boolean }>("/api/auth/email/inspect", { token: link?.token }),
  });

  function enterProduct() {
    const destination = agreementDestination(null, !!link?.oauth);
    window.location.assign(link?.oauth ? `${API_URL}${destination}` : destination);
  }

  async function submit(form: HTMLFormElement, withPasskey: boolean) {
    if (!link) return;
    setBusy(true); setError("");
    try {
      let id = accountId;
      if (!id) {
        const result = await authPost<AuthResult>("/api/auth/email/confirm", { ...link, name: new FormData(form).get("name") ?? "" });
        // Lost MCP sessions and accounts that need nothing else go straight on.
        if (!details.data?.newAccount || !result.redirect.includes("/auth/agreements")) { offerPasskeyAfterSignIn(); completeSignIn(result); return; }
        id = (await apiFetch<{ id: string }>("/api/user")).id;
        setAccountId(id);
      }
      await finishAccountSetup(id, withPasskey && supportsPasskeys, passkeyNameFrom(form));
      enterProduct();
    } catch (err) { setError(authenticationError(err)); setBusy(false); }
  }

  const created = details.data?.newAccount;
  return <main className="mx-auto my-12 w-full max-w-md space-y-5 rounded-[10px] border border-line bg-canvas-elevated p-6">
    <h1 className="text-2xl font-semibold">{created ? "Create your account" : created === false ? "Sign in" : "Confirm your email"}</h1>
    {link ? <>
      {details.data && <p className="break-all text-sm">{created ? "Creating an account for " : "Signing in as "}<strong>{details.data.email}</strong></p>}
      {details.isError && <p role="alert" className="text-sm text-danger">{details.error.message}</p>}
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget, passkey); }}>
        <fieldset disabled={busy || !details.data || details.isError} className="space-y-4">
          {created && <>
            {!accountId && <label className="block space-y-1"><FieldLabel>Your name</FieldLabel><TextInput name="name" autoComplete="name" maxLength={100} defaultValue={details.data?.name ?? ""} /></label>}
            <AccountSetupChoices passkey={passkey} onPasskey={setPasskey} agreed={agreed} onAgreed={setAgreed} />
          </>}
          <Button className="w-full" type="submit" disabled={created && !agreed}>{busy ? (created && passkey && supportsPasskeys ? "Waiting for your passkey…" : "Working…") : accountId ? "Try again" : created ? "Create account" : "Sign in"}</Button>
          {accountId && <Button className="w-full" type="button" variant="ghost" onClick={(event) => void submit(event.currentTarget.form!, false)}>Continue without a passkey</Button>}
        </fieldset>
      </form>
    </> : <p role="status" className="text-sm text-ink-muted">Open the link from your email. If you reloaded this page, reopen that link or request a new one.</p>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <LinkButton href={link?.oauth ? "/login?oauth=1" : "/login"} variant="secondary">Back to sign in</LinkButton>
  </main>;
}
