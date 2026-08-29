const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function ensureCsrfCookie(): Promise<void> {
  await fetch(`${API_URL}/sanctum/csrf-cookie`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const xsrf = readCookie("XSRF-TOKEN");
  if (xsrf) {
    headers.set("X-XSRF-TOKEN", xsrf);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = (await res.json()) as { error?: string; message?: string };
      message = data.error ?? data.message ?? message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export type ApiUser = {
  id: string;
  email: string | null;
  displayName: string;
  grokSubject: string | null;
};

export type AuthSession = {
  token: string;
  user: ApiUser;
};

export type Specialty =
  | "devops"
  | "devsecops"
  | "sre"
  | "mlops"
  | "scaling"
  | "general";

export type Bot = {
  id: string;
  ownerUserId: string;
  name: string;
  description: string;
  specialty: Specialty;
  promptBody: string;
  visibility: "public" | "private";
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
};

export const SPECIALTIES: Specialty[] = [
  "devops",
  "devsecops",
  "sre",
  "mlops",
  "scaling",
  "general",
];
