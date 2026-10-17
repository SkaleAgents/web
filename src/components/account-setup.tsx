"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { acceptAgreement, readAgreement } from "@/lib/account-agreement";
import { apiFetch } from "@/lib/api";
import { addPasskey, deviceName, passkeysSupported, type PasskeySettings } from "@/lib/email-auth";

const noop = () => () => {};

export function usePasskeySupport() {
  return useSyncExternalStore(noop, passkeysSupported, () => false);
}

// Agreement first: passkey routes require an accepted agreement.
export async function finishAccountSetup(accountId: string, wantPasskey: boolean): Promise<void> {
  const status = await readAgreement();
  if (status.required && (await acceptAgreement(status)).required) throw new Error("Your agreement was not saved. Try again.");
  if (!wantPasskey) return;
  const settings = await apiFetch<PasskeySettings>("/api/account/passkeys");
  if (!settings.passkeys.length) await addPasskey(accountId, deviceName());
}

export function AccountSetupChoices({ passkey, onPasskey, agreed, onAgreed }: { passkey: boolean; onPasskey: (value: boolean) => void; agreed: boolean; onAgreed: (value: boolean) => void }) {
  const supported = usePasskeySupport();
  return <div className="space-y-4">
    {supported && <label className="flex items-start gap-3 rounded-lg border border-line bg-canvas p-4 text-sm leading-relaxed">
      <input className="mt-1 size-4 accent-accent" type="checkbox" checked={passkey} onChange={(event) => onPasskey(event.target.checked)} />
      <span><strong className="block text-ink">Set up a passkey (recommended)</strong><span className="text-ink-muted">Sign in with Touch ID, Face ID, or your screen lock. It also confirms deletes and access or billing changes, so an agent can&apos;t make them alone.</span></span>
    </label>}
    <label className="flex items-start gap-3 text-sm leading-relaxed">
      <input className="mt-1 size-4 accent-accent" type="checkbox" required checked={agreed} onChange={(event) => onAgreed(event.target.checked)} />
      <span>I agree to the <Link className="underline underline-offset-2" href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</Link> and acknowledge the <Link className="underline underline-offset-2" href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.</span>
    </label>
  </div>;
}
