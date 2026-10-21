"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ensureCsrfCookie } from "@/lib/api";
import { addPasskey, authenticationError, deviceName, type PasskeySettings } from "@/lib/email-auth";
import { Button, LinkButton, TextInput } from "./ui";
import { currentUserOptions } from "@/lib/session";

export function AccountSecurity({ accountId }: { accountId: string }) {
  const client = useQueryClient();
  const key = ["account-security", accountId];
  const settings = useQuery({ queryKey: key, queryFn: async ({ signal }) => {
    const result = await apiFetch<PasskeySettings>("/api/account/passkeys", { signal });
    if (result.accountId !== accountId) throw new Error("Your account changed. Reload Settings.");
    return result;
  } });
  const [renaming, setRenaming] = useState("");
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
    <h2 className="text-lg font-semibold">Your passkeys</h2>
    <p className="text-sm text-ink-muted">Add a passkey to sign in with Touch ID, Face ID, or your device&apos;s screen lock. Your biometric data stays on your device.</p>
    {settings.isPending ? <p>Loading sign-in methods…</p> : settings.isError ? <div role="alert"><p>{settings.error.message}</p><Button variant="secondary" onClick={() => void settings.refetch()}>Retry</Button></div> : <>
      <Button type="button" disabled={busy} onClick={() => void run(async () => {
        // Saved under the device name first; the new row then opens for renaming.
        const known = new Set(settings.data?.passkeys.map((passkey) => passkey.id));
        const result = await addPasskey(accountId, deviceName());
        setRenaming(result.passkeys.find((passkey) => !known.has(passkey.id))?.id ?? "");
        return result;
      }, "Passkey added. Rename it if you'd like.")}>{busy ? "Waiting for your device…" : "Add a passkey"}</Button>
      <p className="text-xs text-ink-muted">Your first passkey needs a sign-in within the last 10 minutes; adding or removing more asks you to confirm with a passkey. <a href="/auth/reauth?next=%2Faccount%2Fpasskeys" className="underline">Sign in again</a> if prompted.</p>
      {settings.data.passkeys.length ? <ul className="divide-y divide-line">{settings.data.passkeys.map((passkey) => <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={passkey.id}>
        {renaming === passkey.id ? <form className="flex min-w-0 flex-1 flex-wrap items-end gap-2" onSubmit={(event) => {
          event.preventDefault();
          const value = String(new FormData(event.currentTarget).get("name") ?? "").trim();
          if (value) void run(async () => { await ensureCsrfCookie(); const result = await apiFetch<PasskeySettings>(`/api/account/passkeys/${passkey.id}`, { method: "PATCH", body: JSON.stringify({ accountId, name: value }) }); setRenaming(""); return result; }, "Passkey renamed.");
        }}>
          <label className="min-w-0 flex-1"><span className="sr-only">New name for {passkey.name}</span><TextInput name="name" defaultValue={passkey.name} required maxLength={80} autoFocus disabled={busy} /></label>
          <Button type="submit" disabled={busy}>Save</Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => setRenaming("")}>Cancel</Button>
        </form> : <>
        <span className="min-w-0 flex-1 break-words text-sm">{passkey.name}<span className="block text-xs text-ink-muted">{passkey.last_used_at ? `Last used ${new Date(passkey.last_used_at).toLocaleDateString()}` : "Not used yet"}</span></span>
        <Button variant="ghost" disabled={busy} aria-label={`Rename ${passkey.name}`} onClick={() => setRenaming(passkey.id)}>Rename</Button>
        <Button variant="secondary" disabled={busy} aria-label={`Remove ${passkey.name}`} onClick={() => void run(async () => { await ensureCsrfCookie(); return apiFetch<PasskeySettings>(`/api/account/passkeys/${passkey.id}`, { method: "DELETE", body: JSON.stringify({ accountId }) }); }, "Passkey removed.")}>Remove</Button>
        </>}
      </li>)}</ul> : <p className="text-sm text-ink-muted">No passkeys added yet.</p>}
    </>}
    {message && <p role="status" className="text-sm">{message}</p>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <LinkButton href="/auth/reauth?next=%2Faccount%2Fpasskeys" variant="ghost">Use another sign-in method</LinkButton>
  </section>;
}
