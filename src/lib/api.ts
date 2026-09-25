export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export const API_REQUEST_TIMEOUT_MS = 15_000;

export class ApiTimeoutError extends Error {
  constructor() {
    super("Request timed out. Check the latest state before retrying a change.");
    this.name = "ApiTimeoutError";
  }
}

async function withDeadline<T>(signal: AbortSignal | null | undefined, action: (signal: AbortSignal) => Promise<T>): Promise<T> {
  signal?.throwIfAborted();
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(new ApiTimeoutError());
  }, API_REQUEST_TIMEOUT_MS);
  let rejectAbort: () => void = () => {};
  const interrupted = new Promise<never>((_, reject) => {
    rejectAbort = () => reject(controller.signal.reason);
    controller.signal.addEventListener("abort", rejectAbort, { once: true });
  });
  try {
    return await Promise.race([action(controller.signal), interrupted]);
  } catch (error) {
    if (timedOut) throw new ApiTimeoutError();
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
    controller.signal.removeEventListener("abort", rejectAbort);
  }
}

export type McpConnection = {
  id: string;
  clientId: string;
  clientName?: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
};

export type EmailPreferences = {
  auditCompleted: boolean;
  auditFailed: boolean;
  reviewUpdates: boolean;
};

export type NotificationSettings = {
  accountId: string;
  email: string;
  emailVerified: boolean;
  deliveryEnabled: boolean;
  preferences: EmailPreferences;
};

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

export async function ensureCsrfCookie(signal?: AbortSignal): Promise<void> {
  return withDeadline(signal, async (requestSignal) => {
    const response = await fetch(`${API_URL}/sanctum/csrf-cookie`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal: requestSignal,
    });
    if (!response.ok) throw new ApiError("Could not prepare a secure request", response.status);
    await response.body?.cancel();
  });
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  return withDeadline(init.signal, (signal) => apiRequest<T>(`${API_URL}${path}`, { ...init, signal }));
}

async function apiRequest<T>(url: string, init: RequestInit): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const xsrf = readCookie("XSRF-TOKEN");
  if (xsrf) {
    headers.set("X-XSRF-TOKEN", xsrf);
  }

  const res = await fetch(url, {
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
    throw new ApiError(message, res.status);
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
  return withDeadline(init.signal, async (signal) => {
    const method = (init.method ?? "GET").toUpperCase();
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
      await ensureCsrfCookie(signal);
    }
    return apiRequest<T>(`${API_URL}/api/watchtower${path}`, { ...init, signal });
  });
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
  scheduleId?: string | null;
  scope: Record<string, unknown>;
  sourcePurged: boolean;
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

export type SwarmSchedule = {
  id: string;
  name: string;
  cronExpression: string;
  timezone: string;
  scope: Record<string, unknown>;
  specialists: string[];
  telemetry?: Record<string, unknown> | null;
  webhookConfigured: boolean;
  enabled: boolean;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastJobId: string | null;
  lastNotifiedJobId: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
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
  redirects?: WatchtowerRedirect[];
};

export type WatchtowerRedirect = {
  id: string;
  sessionId: string;
  jobId: string;
  userId: string;
  instruction: string;
  createdAt: string;
};

export type AdvisoryBookingSourceType = "audit_job" | "watchtower_session";

export type AdvisoryBooking = {
  id: string;
  source: {
    type: AdvisoryBookingSourceType;
    id: string;
  };
  status: "requested" | "accepted" | "scheduled" | "in_progress" | "completed" | "cancelled";
  assigneeRef: string | null;
  scope: string;
  urgency: "routine" | "soon" | "urgent" | "emergency";
  preferredWindow: {
    startAt: string;
    endAt: string;
  };
  notes: string | null;
  billing: {
    billableMinutes: number | null;
    feeCents: number | null;
    currency: string | null;
  };
  createdAt: string;
  updatedAt: string;
};

export type AdvisoryBookingHistoryEntry = {
  id: string;
  type: "assignment" | "status" | "billing";
  actorRef: string;
  fromStatus: AdvisoryBooking["status"] | null;
  toStatus: AdvisoryBooking["status"] | null;
  assigneeRef: string | null;
  billing: AdvisoryBooking["billing"];
  createdAt: string;
};

export type StaffAdvisoryBooking = AdvisoryBooking & {
  history: AdvisoryBookingHistoryEntry[];
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

export type ProposalGenerationResult = {
  proposals: PatchProposal[];
  skipped: Array<{ title: string; resource: string; reason: string }>;
};

export type ApiUser = {
  id: string;
  email: string | null;
  displayName: string;
  googleSubject?: string | null;
  grokSubject: string | null;
  grokLinked?: boolean;
  staffRole?: "staff" | "operator" | null;
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

export type SubscriptionEntitlements = {
  plan: "free" | "team" | "enterprise";
  planLabel: string;
  mcpSeats: {
    used: number;
    limit: number;
    available: number;
  };
  upgrade: {
    required: boolean;
    path: string;
    message: string | null;
  };
};
