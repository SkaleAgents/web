"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { agreementDestination, readAgreement, type AgreementStatus } from "@/lib/account-agreement";
import { AccountSetupChoices, finishAccountSetup, passkeyNameFrom } from "@/components/account-setup";
import { authenticationError } from "@/lib/email-auth";
import { API_URL } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { Button } from "@/components/ui";

export function AccountAgreementScreen({ next, oauth }: { next: string | null; oauth: boolean }) {
  const router = useRouter();
  const client = useQueryClient();
  const user = useQuery(currentUserOptions);
  const [status, setStatus] = useState<AgreementStatus | null>(null);
  const [checked, setChecked] = useState(false);
  const [passkey, setPasskey] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user.data === null) router.replace(oauth ? "/login?oauth=1" : `/login?next=${encodeURIComponent("/auth/agreements")}`);
  }, [oauth, router, user.data]);

  useEffect(() => {
    if (!user.data) return;
    let active = true;
    readAgreement().then(result => { if (active) setStatus(result); })
      .catch(() => { if (active) setError("Could not load the current policies. Try reloading this page."); });
    return () => { active = false; };
  }, [user.data]);

  const continueToProduct = useCallback(() => {
    const destination = agreementDestination(next, oauth);
    if (oauth) window.location.replace(`${API_URL}${destination}`);
    else router.replace(destination);
  }, [next, oauth, router]);

  useEffect(() => {
    if (status && !status.required && !accepted) continueToProduct();
  }, [status, accepted, continueToProduct]);

  async function submit(withPasskey: boolean, name = "") {
    if (!status || !checked || busy || !user.data) return;
    setBusy(true);
    setError("");
    setAccepted(true);
    try {
      await finishAccountSetup(user.data.id, withPasskey, name);
      client.setQueryData(currentUserOptions.queryKey, current => current ? { ...current, agreementRequired: false } : current);
      continueToProduct();
    } catch (reason) {
      setError(authenticationError(reason));
    } finally {
      setBusy(false);
    }
  }

  return <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-12">
    <h1 className="font-display text-3xl font-bold tracking-tight">Finish setting up your account</h1>
    <p className="mt-3 text-ink-muted">Review the Terms of Service and Privacy Policy, and add a passkey for faster sign-in and safer changes.</p>
    {(status?.required || accepted) && <form className="mt-7 space-y-5 rounded-xl border border-line bg-canvas-elevated p-6" onSubmit={event => { event.preventDefault(); void submit(passkey, passkeyNameFrom(event.currentTarget)); }}>
      <AccountSetupChoices passkey={passkey} onPasskey={setPasskey} agreed={checked} onAgreed={setChecked} />
      <Button className="w-full" type="submit" disabled={!checked || busy}>{busy ? "Saving…" : error && accepted ? "Try again" : "Continue"}</Button>
      {error && accepted && <Button className="w-full" type="button" variant="ghost" disabled={busy} onClick={() => void submit(false)}>Continue without a passkey</Button>}
    </form>}
    {error && <p className="mt-4 text-sm text-danger" role="alert">{error}</p>}
    {!status && !error && <p className="mt-7 text-sm text-ink-muted" role="status">Checking your account…</p>}
  </main>;
}
