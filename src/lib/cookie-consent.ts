const COOKIE = "skale_cookie_consent";
const MAX_AGE = 60 * 60 * 24 * 180;
const listeners = new Set<() => void>();
let cached: { cookie: string; choice: "accepted" | null } | null = null;

export type CookieChoice = "accepted";

function emit() {
  cached = null;
  listeners.forEach(listener => listener());
}

export function subscribeCookieConsent(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function readChoice(): CookieChoice | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie ? document.cookie.split("; ") : [];
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1 || part.slice(0, eq) !== COOKIE) continue;
    const value = decodeURIComponent(part.slice(eq + 1));
    return value === "accepted" ? value : null;
  }
  return null;
}

export function cookieChoice(): CookieChoice | null {
  const cookie = typeof document === "undefined" ? "" : document.cookie;
  if (cached && cached.cookie === cookie) return cached.choice;
  const choice = readChoice();
  cached = { cookie, choice };
  return choice;
}

export function optionalCookiesAllowed() {
  return cookieChoice() === "accepted";
}

export function saveCookieChoice(choice: CookieChoice) {
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${choice}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  emit();
}
