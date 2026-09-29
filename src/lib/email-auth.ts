import { apiFetch, ensureCsrfCookie } from "./api";

export type AuthResult = { ok: boolean; redirect: string };
export type EmailLink = { token: string; purpose: "signin" | "password" | "register" };

declare global {
  interface Window { __skaleEmailLink?: EmailLink }
}

// Runs before external scripts. The credential stays out of requests and browser storage.
export const captureEmailLinkScript = `(() => {
  if (location.pathname !== "/auth/confirm") return;
  const params = new URLSearchParams(location.hash.slice(1));
  const token = params.get("token"), purpose = params.get("purpose");
  history.replaceState(history.state, "", location.pathname);
  if (token && /^[a-zA-Z0-9]{64}$/.test(token) && ["signin", "password", "register"].includes(purpose)) {
    window.__skaleEmailLink = { token, purpose };
  }
})();`;

export async function authPost<T>(path: string, body: unknown): Promise<T> {
  await ensureCsrfCookie();
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function completeSignIn(result: AuthResult) {
  delete window.__skaleEmailLink;
  const destination = new URL(result.redirect, window.location.origin);
  if (destination.origin === window.location.origin && destination.pathname === "/auth/agreements") {
    const next = new URLSearchParams(window.location.search).get("next");
    if (next && !destination.searchParams.has("oauth")) destination.searchParams.set("next", next);
    window.location.assign(destination.toString());
    return;
  }
  if (destination.origin === window.location.origin && destination.pathname === "/dashboard") {
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.assign(next ? `/dashboard?next=${encodeURIComponent(next)}` : "/dashboard");
  } else {
    window.location.assign(result.redirect);
  }
}

function decode(value: string): ArrayBuffer {
  return Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)).buffer;
}

function encode(value: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(value))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function passkeysSupported() {
  return typeof window !== "undefined" && window.isSecureContext && typeof window.PublicKeyCredential !== "undefined";
}

export function authenticationError(error: unknown): string {
  if (error instanceof DOMException && error.name === "NotAllowedError") return "Passkey request cancelled or unavailable. Try again, or use a password or email link.";
  if (error instanceof DOMException && error.name === "InvalidStateError") return "This device already has a passkey for your account. Try signing in with it.";
  return error instanceof Error ? error.message : "Could not complete sign-in. Try again.";
}

export async function signInWithPasskey(email: string): Promise<AuthResult> {
  if (!passkeysSupported()) throw new Error("Passkeys aren't supported here. Use a password or email link.");
  const result = await authPost<{ challengeId: string; publicKey: { challenge: string; rpId: string; timeout: number; userVerification: UserVerificationRequirement } }>("/api/auth/passkeys/options", { email });
  const credential = await navigator.credentials.get({ publicKey: { ...result.publicKey, challenge: decode(result.publicKey.challenge) } }) as PublicKeyCredential | null;
  if (!credential) throw new Error("No passkey selected. Try another sign-in method.");
  const response = credential.response as AuthenticatorAssertionResponse;
  return authPost<AuthResult>("/api/auth/passkeys/verify", {
    challengeId: result.challengeId, id: encode(credential.rawId),
    clientDataJSON: encode(response.clientDataJSON), authenticatorData: encode(response.authenticatorData),
    signature: encode(response.signature), userHandle: response.userHandle ? encode(response.userHandle) : "",
  });
}

export type PasskeySettings = {
  accountId: string; hasPassword: boolean;
  passkeys: Array<{ id: string; name: string; created_at: string; last_used_at: string | null }>;
};

type CreationOptions = Omit<PublicKeyCredentialCreationOptions, "challenge" | "user" | "excludeCredentials"> & {
  challenge: string; user: { id: string; name: string; displayName: string };
  excludeCredentials?: Array<{ type: PublicKeyCredentialType; id: string }>;
};

export async function addPasskey(accountId: string, name: string): Promise<PasskeySettings> {
  if (!passkeysSupported()) throw new Error("Passkeys aren't supported in this browser.");
  const result = await authPost<{ challengeId: string; publicKey: CreationOptions }>("/api/account/passkeys/options", { accountId });
  const credential = await navigator.credentials.create({ publicKey: {
    ...result.publicKey, challenge: decode(result.publicKey.challenge),
    user: { ...result.publicKey.user, id: decode(result.publicKey.user.id) },
    excludeCredentials: result.publicKey.excludeCredentials?.map((key) => ({ ...key, id: decode(key.id) })),
  } }) as PublicKeyCredential | null;
  if (!credential) throw new Error("Passkey creation cancelled.");
  const response = credential.response as AuthenticatorAttestationResponse;
  return authPost<PasskeySettings>("/api/account/passkeys", { accountId, name, challengeId: result.challengeId,
    clientDataJSON: encode(response.clientDataJSON), attestationObject: encode(response.attestationObject) });
}
