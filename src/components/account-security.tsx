"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ensureCsrfCookie } from "@/lib/api";
import { addPasskey, authPost, authenticationError, type PasskeySettings } from "@/lib/email-auth";
import { Button, FieldLabel, LinkButton, TextInput } from "./ui";
import { currentUserOptions } from "@/lib/session";

export function AccountSecurity({ accountId, email }: { accountId: string; email: string | null }) {
  const client = useQueryClient();
  const key = ["account-security", accountId];
  const settings = useQuery({ queryKey: key, queryFn: async ({ signal }) => {
    const result = await apiFetch<PasskeySettings>("/api/account/passkeys", { signal });
    if (result.accountId !== accountId) throw new Error("Your account changed. Reload Settings.");
    return result;
  } });
  const [name, setName] = useState("My device");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function run(action: () => Promise<PasskeySettings | void>, success: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await action();
      if (client.getQueryData(currentUserOptions.queryKey)?.id !== accountId) return;
      if (result) {
        if (result.accountId !== accountId) throw new Error("Your account changed. Reload Settings.");
        client.setQueryData(key, result);
      }
      setMessage(success);
    } catch (err) { setError(authenticationError(err)); }
    finally { setBusy(false); }
  }

  return <section className="space-y-4 rounded-[10px] border border-line bg-canvas-elevated p-5">
    <h2 className="text-lg font-semibold">Sign-in and security</h2>
    <p className="text-sm text-ink-muted">Add a passkey to sign in with Touch ID, Face ID, or your device&apos;s screen lock. Your biometric data stays on your device.</p>
    {settings.isPending ? <p>Loading sign-in methods…</p> : settings.isError ? <div role="alert"><p>{settings.error.message}</p><Button variant="secondary" onClick={() => void settings.refetch()}>Retry</Button></div> : <>
      <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); void run(() => addPasskey(accountId, name), "Passkey added."); }}>
        <label className="min-w-0 flex-1 space-y-1"><FieldLabel>Passkey name</FieldLabel><TextInput value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} disabled={busy} /></label>
        <Button type="submit" disabled={busy}>Add a passkey</Button>
      </form>
      <p className="text-xs text-ink-muted">Adding or removing passkeys requires sign-in within the last 10 minutes. <a href="/auth/reauth?next=%2Fdashboard%2Fsettings" className="underline">Sign in again</a> if prompted.</p>
      {settings.data.passkeys.length ? <ul className="divide-y divide-line">{settings.data.passkeys.map((passkey) => <li className="flex items-center justify-between gap-3 py-3" key={passkey.id}>
        <span className="min-w-0 break-words text-sm">{passkey.name}<span className="block text-xs text-ink-muted">{passkey.last_used_at ? `Last used ${new Date(passkey.last_used_at).toLocaleDateString()}` : "Not used yet"}</span></span>
        <Button variant="secondary" disabled={busy} aria-label={`Remove ${passkey.name}`} onClick={() => void run(async () => { await ensureCsrfCookie(); return apiFetch<PasskeySettings>(`/api/account/passkeys/${passkey.id}`, { method: "DELETE", body: JSON.stringify({ accountId }) }); }, "Passkey removed.")}>Remove</Button>
      </li>)}</ul> : <p className="text-sm text-ink-muted">No passkeys added yet.</p>}
      <div className="border-t border-line pt-4">
        <Button variant="secondary" disabled={busy || !email} onClick={() => void run(async () => { await authPost("/api/auth/email", { email, purpose: "password" }); }, "Check your email to set or change your password.")}>{settings.data.hasPassword ? "Change password by email" : "Set a password by email"}</Button>
      </div>
    </>}
    {message && <p role="status" className="text-sm">{message}</p>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <LinkButton href="/auth/reauth?next=%2Fdashboard%2Fsettings" variant="ghost">Use another sign-in method</LinkButton>
  </section>;
}
