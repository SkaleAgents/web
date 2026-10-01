const COOKIE = "skale_retention_later";
const DAY_MS = 24 * 60 * 60 * 1000;
const listeners = new Set<() => void>();
const snapshots = new Map<string, { cookie: string; active: boolean }>();

function emit() {
  listeners.forEach(listener => listener());
}

export function subscribeRetentionLater(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

type LaterMap = Record<string, number>;

function readMap(): LaterMap {
  if (typeof document === "undefined") return {};
  const parts = document.cookie ? document.cookie.split("; ") : [];
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1 || part.slice(0, eq) !== COOKIE) continue;
    try {
      const parsed = JSON.parse(decodeURIComponent(part.slice(eq + 1))) as LaterMap;
      if (!parsed || typeof parsed !== "object") return {};
      return parsed;
    } catch {
      return {};
    }
  }
  return {};
}

function writeMap(map: LaterMap, now: number) {
  const active = Object.fromEntries(Object.entries(map).filter(([, until]) => typeof until === "number" && until > now));
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  if (Object.keys(active).length === 0) {
    document.cookie = `${COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
    return;
  }
  const latest = Math.max(...Object.values(active));
  const maxAge = Math.max(1, Math.ceil((latest - now) / 1000));
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(active))}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
  snapshots.clear();
  emit();
}

export function retentionLaterUntil(accountId: string, now = Date.now()): number | null {
  const until = readMap()[accountId];
  return typeof until === "number" && until > now ? until : null;
}

export function retentionLaterActive(accountId: string): boolean {
  const cookie = typeof document === "undefined" ? "" : document.cookie;
  const previous = snapshots.get(accountId);
  if (previous && previous.cookie === cookie) return previous.active;
  const active = retentionLaterUntil(accountId) !== null;
  snapshots.set(accountId, { cookie, active });
  return active;
}

export function snoozeRetentionNotice(accountId: string, now = Date.now()): number {
  const until = now + DAY_MS;
  writeMap({ ...readMap(), [accountId]: until }, now);
  return until;
}
