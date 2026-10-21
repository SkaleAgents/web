"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ensureCsrfCookie } from "@/lib/api";
import { addPasskey, authenticationError, deviceName, passkeysSupported, type PasskeySettings } from "@/lib/email-auth";
import { currentUserOptions } from "@/lib/session";
import { Button, FieldLabel, TextInput } from "./ui";

const KEY = "skale:offer-passkey";
const DISMISSED = "skale:passkey-prompt-dismissed";
const noop = () => () => {};

export function offerPasskeyAfterSignIn() {
  sessionStorage.setItem(KEY, "1");
}

// Every account without a passkey sees this until dismissed for the session; it's stronger after an emailed link.
// The passkey is saved under the device name first; the name question comes after, so a cancelled rename loses nothing.
export function PasskeyPrompt() {
  const supported = useSyncExternalStore(noop, () => passkeysSupported() && sessionStorage.getItem(DISMISSED) !== "1", () => false);
  const afterLink = useSyncExternalStore(noop, () => sessionStorage.getItem(KEY) === "1", () => false);
  const client = useQueryClient();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [closed, setClosed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState<{ id: string; name: string } | null>(null);
  const user = useQuery({ ...currentUserOptions, enabled: supported });
  const settings = useQuery({
    queryKey: ["account-security", user.data?.id],
    enabled: supported && !!user.data?.id && !user.data.agreementRequired,
    queryFn: ({ signal }) => apiFetch<PasskeySettings>("/api/account/passkeys", { signal }),
  });
  const accountId = settings.data?.accountId;
  const show = !closed && !!settings.data && accountId === user.data?.id && (!settings.data.passkeys.length || !!added);

  useEffect(() => {
    const node = dialog.current;
    if (show && node && !node.open) node.showModal();
  }, [show]);

  function close() {
    sessionStorage.removeItem(KEY); sessionStorage.setItem(DISMISSED, "1");
    dialog.current?.close();
    setClosed(true);
  }

  async function add() {
    if (!accountId) return;
    setBusy(true); setError("");
    try {
      const name = deviceName();
      const result = await addPasskey(accountId, name);
      client.setQueryData(["account-security", accountId], result);
      const created = [...result.passkeys].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      if (created) setAdded({ id: created.id, name }); else close();
    } catch (err) { setError(authenticationError(err)); }
    finally { setBusy(false); }
  }

  async function rename(value: string) {
    if (!accountId || !added || !value || value === added.name) return close();
    setBusy(true); setError("");
    try {
      await ensureCsrfCookie();
      const result = await apiFetch<PasskeySettings>(`/api/account/passkeys/${added.id}`, { method: "PATCH", body: JSON.stringify({ accountId, name: value }) });
      client.setQueryData(["account-security", accountId], result);
      close();
    } catch (err) { setError(authenticationError(err)); }
    finally { setBusy(false); }
  }

  if (!show) return null;

  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); if (!busy) close(); }}
    className="passkey-prompt-dialog m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-canvas-elevated p-6 text-ink shadow-2xl sm:p-8">
    {added ? <form onSubmit={(event) => { event.preventDefault(); void rename(String(new FormData(event.currentTarget).get("name") ?? "").trim()); }}>
      <h2 id={titleId} className="text-lg font-semibold">Passkey added</h2>
      <p className="mt-2 text-sm text-ink-muted">It&apos;s saved as &ldquo;{added.name}&rdquo;. Rename it if you&apos;d like something you&apos;ll recognise later.</p>
      <label className="mt-4 block space-y-1"><FieldLabel>Passkey name</FieldLabel><TextInput name="name" defaultValue={added.name} maxLength={80} autoFocus disabled={busy} /></label>
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save name"}</Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={close}>Keep name</Button>
      </div>
    </form> : <>
      <h2 id={titleId} className="text-lg font-semibold">{afterLink ? "Add a passkey (highly recommended)" : "Protect your account with a passkey"}</h2>
      <p className="mt-2 text-sm text-ink-muted">{afterLink
        ? "Sign in with Touch ID, Face ID, or your screen lock instead of waiting for an email. Emailed links still work as a backup."
        : "AI browser agents can act in your signed-in session. With a passkey, deletes and access or billing changes need your Touch ID, Face ID, or screen lock, so an agent can't make them alone."}</p>
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" disabled={busy} onClick={() => void add()}>{busy ? "Waiting for your device…" : "Add a passkey"}</Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={close}>Not now</Button>
      </div>
    </>}
  </dialog>;
}
