const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082";

const MOCK_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_MOCK_AUTH_ENABLED === "true";

export function googleSignInHref(): string {
  if (MOCK_AUTH_ENABLED) return "/login";
  return `${API_URL}/api/auth/google/redirect`;
}

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

export async function watchtowerFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    await ensureCsrfCookie();
  }
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const xsrf = readCookie("XSRF-TOKEN");
  if (xsrf) {
    headers.set("X-XSRF-TOKEN", xsrf);
  }
  const res = await fetch(`${API_URL}/api/watchtower${path}`, {
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
  return res.json() as Promise<T>;
}

export type SwarmFinding = {
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  detail: string;
  resource: string;
  remediation: string;
  specialist: "devsecops" | "sre" | "mlops" | "scaling";
};

export type SwarmJob = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  requestedBy: string;
  scope: Record<string, unknown>;
  specialists: string[];
  partial: boolean;
  summary?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  findings?: SwarmFinding[];
  tasks?: Array<{ specialist: string; status: string; skipReason?: string }>;
  steps?: SwarmStep[];
};

export type SwarmStep = {
  jobId: string;
  stepId: string;
  agent: string;
  message: string;
  ts: string;
};

export type WatchtowerSession = {
  id: string;
  jobId: string;
  status: "open" | "closed";
  participants: Array<{ userId: string; joinedAt: string }>;
  createdAt: string;
  closedAt?: string;
};

export type PatchProposal = {
  id: string;
  sessionId: string;
  jobId: string;
  finding: SwarmFinding;
  diff: string;
  status: "pending" | "approved" | "modified" | "rejected";
  history: Array<{ action: string; userId: string; at: string; reason?: string }>;
};

export type ApiUser = {
  id: string;
  email: string | null;
  displayName: string;
  googleSubject?: string | null;
  grokSubject: string | null;
  grokLinked?: boolean;
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

export type Prompt = {
  id: string;
  ownerUserId: string | null;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
};

export type ApiToken = {
  id: string;
  name: string;
  lastUsedAt: string | null;
  createdAt: string;
};

export type ApiTokenCreated = {
  token: string;
  apiToken: ApiToken;
};
