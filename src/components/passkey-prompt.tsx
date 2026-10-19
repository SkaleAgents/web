"use client";

import { useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { addPasskey, authenticationError, deviceName, passkeysSupported, type PasskeySettings } from "@/lib/email-auth";
import { currentUserOptions } from "@/lib/session";
import { PasskeyNameField, passkeyNameFrom } from "./account-setup";
import { Button } from "./ui";

const KEY = "skale:offer-passkey";
const DISMISSED = "skale:passkey-prompt-dismissed";
const noop = () => () => {};

export function offerPasskeyAfterSignIn() {
  sessionStorage.setItem(KEY, "1");
}

// Every account without a passkey sees this until dismissed for the session; it's stronger after an emailed link.
export function PasskeyPrompt() {
  const supported = useSyncExternalStore(noop, () => passkeysSupported() && sessionStorage.getItem(DISMISSED) !== "1", () => false);
  const afterLink = useSyncExternalStore(noop, () => sessionStorage.getItem(KEY) === "1", () => false);
  const [closed, setClosed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const user = useQuery({ ...currentUserOptions, enabled: supported });
  const settings = useQuery({
    queryKey: ["account-security", user.data?.id],
    enabled: supported && !!user.data?.id && !user.data.agreementRequired,
    queryFn: ({ signal }) => apiFetch<PasskeySettings>("/api/account/passkeys", { signal }),
  });

  function close() { sessionStorage.removeItem(KEY); sessionStorage.setItem(DISMISSED, "1"); setClosed(true); }

  if (closed || !settings.data || settings.data.accountId !== user.data?.id || settings.data.passkeys.length) return null;

  return <section aria-labelledby="passkey-prompt" className="mb-6 space-y-3 rounded-[10px] border border-line bg-canvas-elevated p-5">
    <h2 id="passkey-prompt" className="text-lg font-semibold">{afterLink ? "Add a passkey (highly recommended)" : "Protect your account with a passkey"}</h2>
    <p className="text-sm text-ink-muted">{afterLink
      ? "Sign in with Touch ID, Face ID, or your screen lock instead of waiting for an email. Emailed links still work as a backup."
      : "AI browser agents can act in your signed-in session. With a passkey, deletes and access or billing changes need your Touch ID, Face ID, or screen lock, so an agent can't make them alone."}</p>
    <form className="space-y-3" onSubmit={async (event) => {
      event.preventDefault();
      setBusy(true); setError("");
      try { await addPasskey(settings.data.accountId, passkeyNameFrom(event.currentTarget).trim() || deviceName()); close(); }
      catch (err) { setError(authenticationError(err)); }
      finally { setBusy(false); }
    }}>
      <div className="max-w-sm"><PasskeyNameField disabled={busy} /></div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>{busy ? "Waiting for your device…" : "Add a passkey"}</Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={close}>Not now</Button>
      </div>
    </form>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
  </section>;
}
