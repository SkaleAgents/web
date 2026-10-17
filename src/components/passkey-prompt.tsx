"use client";

import { useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { addPasskey, authenticationError, passkeysSupported, type PasskeySettings } from "@/lib/email-auth";
import { currentUserOptions } from "@/lib/session";
import { Button } from "./ui";

const KEY = "skale:offer-passkey";
const noop = () => () => {};

export function offerPasskeyAfterSignIn() {
  sessionStorage.setItem(KEY, "1");
}

// Shown once after an emailed sign-in link so the next sign-in can use a passkey instead.
export function PasskeyPrompt() {
  const offered = useSyncExternalStore(noop, () => sessionStorage.getItem(KEY) === "1" && passkeysSupported(), () => false);
  const [closed, setClosed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const user = useQuery({ ...currentUserOptions, enabled: offered });
  const settings = useQuery({
    queryKey: ["account-security", user.data?.id],
    enabled: offered && !!user.data?.id && !user.data.agreementRequired,
    queryFn: ({ signal }) => apiFetch<PasskeySettings>("/api/account/passkeys", { signal }),
  });

  function close() { sessionStorage.removeItem(KEY); setClosed(true); }

  if (closed || !settings.data || settings.data.accountId !== user.data?.id) return null;
  if (settings.data.passkeys.length) { sessionStorage.removeItem(KEY); return null; }

  return <section aria-labelledby="passkey-prompt" className="mx-auto mb-6 w-full max-w-3xl space-y-3 rounded-[10px] border border-line bg-canvas-elevated p-5">
    <h2 id="passkey-prompt" className="text-lg font-semibold">Sign in faster next time</h2>
    <p className="text-sm text-ink-muted">Add a passkey to sign in with Touch ID, Face ID, or your screen lock. Emailed sign-in links still work as a backup.</p>
    <div className="flex flex-wrap gap-3">
      <Button disabled={busy} onClick={async () => {
        setBusy(true); setError("");
        try { await addPasskey(settings.data.accountId, "My device"); close(); }
        catch (err) { setError(authenticationError(err)); }
        finally { setBusy(false); }
      }}>{busy ? "Waiting for your device…" : "Add a passkey"}</Button>
      <Button variant="ghost" disabled={busy} onClick={close}>Not now</Button>
    </div>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
  </section>;
}
