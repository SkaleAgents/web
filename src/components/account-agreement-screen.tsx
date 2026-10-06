"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptAgreement, agreementDestination, readAgreement, type AgreementStatus } from "@/lib/account-agreement";
import { API_URL } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { Button } from "@/components/ui";

export function AccountAgreementScreen({ next, oauth }: { next: string | null; oauth: boolean }) {
  const router = useRouter();
  const client = useQueryClient();
  const user = useQuery(currentUserOptions);
  const [status, setStatus] = useState<AgreementStatus | null>(null);
  const [checked, setChecked] = useState(false);
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
    if (status && !status.required) continueToProduct();
  }, [status, continueToProduct]);

  async function submit() {
    if (!status || !checked || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await acceptAgreement(status);
      if (result.required) throw new Error("Your agreement was not saved. Try again.");
      client.setQueryData(currentUserOptions.queryKey, (current: typeof user.data) => current ? { ...current, agreementRequired: false } : current);
      continueToProduct();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save your agreement. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-12">
    <h1 className="font-display text-3xl font-bold tracking-tight">Before you continue</h1>
    <p className="mt-3 text-ink-muted">Please review the SkaleAgents Terms of Service and Privacy Policy. Your account needs an explicit agreement before you use private features.</p>
    {status?.required && <form className="mt-7 space-y-5 rounded-xl border border-line bg-canvas-elevated p-6" onSubmit={event => { event.preventDefault(); void submit(); }}>
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input className="mt-1 size-4 accent-accent" type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} />
        <span>I agree to the <Link className="underline underline-offset-2" href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</Link> and acknowledge the <Link className="underline underline-offset-2" href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.</span>
      </label>
      <Button className="w-full" type="submit" disabled={!checked || busy}>{busy ? "Saving…" : "Continue"}</Button>
    </form>}
    {error && <p className="mt-4 text-sm text-danger" role="alert">{error}</p>}
    {!status && !error && <p className="mt-7 text-sm text-ink-muted" role="status">Checking your account…</p>}
  </main>;
}
