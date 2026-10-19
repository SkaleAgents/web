"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ApiError, setPasskeyConfirmer } from "@/lib/api";
import { addPasskey, authenticationError, confirmWithPasskey, deviceName } from "@/lib/email-auth";
import { currentUserOptions } from "@/lib/session";
import { Button, LinkButton } from "./ui";
import { PasskeyNameField, passkeyNameFrom } from "./account-setup";

type Pending = { hasPasskey: boolean; resolve: () => void; reject: (error: Error) => void; promise: Promise<void> };

// Protected actions (deletes, access, billing) wait here until the person confirms with a passkey.
export function PasskeyConfirmation() {
  const dialog = useRef<HTMLDialogElement>(null);
  const pending = useRef<Pending | null>(null);
  const titleId = useId();
  const pathname = usePathname();
  const user = useQuery(currentUserOptions);
  const [hasPasskey, setHasPasskey] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stale, setStale] = useState(false);

  useEffect(() => {
    setPasskeyConfirmer((needsExisting) => {
      if (pending.current) return pending.current.promise;
      let resolve!: () => void, reject!: (error: Error) => void;
      const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail; });
      pending.current = { hasPasskey: needsExisting, resolve, reject, promise };
      setHasPasskey(needsExisting); setError(""); setStale(false);
      dialog.current?.showModal();
      return promise;
    });
    return () => setPasskeyConfirmer(null);
  }, []);

  function settle(error?: Error) {
    const current = pending.current;
    pending.current = null;
    dialog.current?.close();
    if (error) current?.reject(error); else current?.resolve();
  }

  async function run(form: HTMLFormElement | null) {
    setBusy(true); setError("");
    try {
      if (hasPasskey) await confirmWithPasskey();
      else await addPasskey(user.data?.id ?? "", passkeyNameFrom(form).trim() || deviceName());
      settle();
    } catch (err) {
      const message = authenticationError(err);
      setStale(message.startsWith("Sign in again"));
      setError(message);
    } finally { setBusy(false); }
  }

  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); settle(new ApiError("Passkey check cancelled.", 403)); }}
    className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-canvas-elevated p-6 text-ink shadow-2xl sm:p-8">
    <h2 id={titleId} className="font-display text-2xl font-semibold tracking-tight">{hasPasskey ? "Confirm it's you" : "Add a passkey to continue"}</h2>
    <p className="mt-3 text-sm leading-relaxed text-ink-muted">{hasPasskey
      ? "This action deletes data or changes access or billing. Confirm with your passkey. It stays confirmed for 5 minutes."
      : "Deleting data and changing access or billing needs a passkey, so an agent or someone with your session can't do it alone. Add one with Touch ID, Face ID, or your screen lock."}</p>
    <form onSubmit={(event) => { event.preventDefault(); void run(event.currentTarget); }}>
    {!hasPasskey && !stale && <div className="mt-4"><PasskeyNameField disabled={busy} /></div>}
    {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
    <div className="mt-6 flex flex-wrap gap-3">
      {stale
        ? <LinkButton href={`/auth/reauth?next=${encodeURIComponent(pathname)}`}>Sign in again</LinkButton>
        : <Button type="submit" disabled={busy}>{busy ? "Waiting for your device…" : hasPasskey ? "Use my passkey" : "Add a passkey"}</Button>}
      <Button type="button" variant="ghost" disabled={busy} onClick={() => settle(new ApiError("Passkey check cancelled.", 403))}>Cancel</Button>
    </div>
    </form>
  </dialog>;
}
