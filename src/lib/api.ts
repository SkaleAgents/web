import type { AuditCoverage, CheckCoverage } from "./audit-coverage";
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
  if (xsrf && init.credentials !== "omit") {
    headers.set("X-XSRF-TOKEN", xsrf);
  }

  const res = await fetch(url, {
    ...init,
    credentials: init.credentials ?? "include",
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
  id?: string;
  classification?: "unclassified" | "builtin-v1";
  inputLocatorAvailable?: boolean;
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  detail: string;
  resource: string;
  remediation: string;
  specialist: "devsecops" | "sre" | "mlops" | "scaling";
  location?: { path: string; line: number; column: number } | null;
};

export type SwarmJob = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  requestedBy: string;
  workspaceId?: string | null;
  scheduleId?: string | null;
  dispatchActor?: "user" | "scheduler";
  scope: Record<string, unknown>;
  sourcePurged: boolean;
  sourceRevision?: string | null;
  sourceObservedAt?: string | null;
  sourceMetadataProvenance?: "caller_reported" | "github_fetched";
  retention?: {
    inputAvailable?: boolean;
    inputPurgeStatus: "retained" | "pending" | "purged" | "failed";
    inputExpiresAt: string | null;
    historyExpiresAt: string | null;
    inputPurgedAt: string | null;
  };
  specialists: string[];
  partial: boolean;
  summary?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  findingSummary?: { total: number; highestSeverity: SwarmFinding["severity"] | null };
  findings?: SwarmFinding[];
  coverage?: AuditCoverage;
  tasks?: Array<{ specialist: string; status: string; skipReason?: string; checkCoverage?: CheckCoverage | null }>;
  steps?: SwarmStep[];
};

export type InputCleanupResponse = {
  ok: boolean;
  sourcePurged: boolean;
  retention: Pick<NonNullable<SwarmJob["retention"]>, "inputPurgeStatus" | "inputPurgedAt">;
};

export type DeletionPendingResponse = { ok: true; status: "pending" | "processing" | "failed" };

export type SwarmSchedule = {
  id: string;
  name: string;
  cronExpression: string;
  timezone: string;
  scope: Record<string, unknown>;
  sourceRevision?: string | null;
  sourceObservedAt?: string | null;
  specialists: string[];
  telemetry?: Record<string, unknown> | null;
  webhookConfigured: boolean;
  webhookResult?: "none" | "delivered" | "failed";
  findingsChanged?: boolean | null;
  enabled: boolean;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastJobId: string | null;
  lastNotifiedJobId: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  retention?: Omit<NonNullable<SwarmJob["retention"]>, "historyExpiresAt"> & { snapshotId: string; policyVersion: string | null; pausedAt: string | null };
};

export type RetentionPolicy = {
  accountId: string;
  enabled: boolean;
  acknowledgementEnabled?: boolean;
  version: string;
  notice: string[];
  noticeDeliveredAt: string | null;
  legacyNotBefore: string | null;
  noticeArchived: boolean;
  noticeToken: string;
};

export type WorkspaceRetentionPolicy = {
  workspaceId: string;
  acknowledgementEnabled: boolean;
  automaticRetentionEnabled: boolean;
  version: string;
  notice: string[];
  contentHash: string;
  activationNotice: string;
  noticeDeliveredAt: string | null;
  legacyNotBefore: string | null;
  noticeArchived: boolean;
  noticeToken: string;
};

export type WorkspaceCutoverNotice = {
  workspaceId: string;
  version: string;
  contentHash: string;
  effectiveAt: string;
  body: string;
  billingUrl: string;
  supportUrl: string;
  acknowledgementEnabled: boolean;
  acknowledgedAt: string | null;
  noticeToken: string;
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
  skipped?: ProposalGenerationResult["skipped"];
};

export type WatchtowerRedirect = {
  id: string;
  sessionId: string;
  jobId: string;
  userId: string;
  instruction: string;
  createdAt: string;
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

export type EnterpriseInquiry = {
  id: string;
  organizationName: string;
  contactName: string;
  email: string;
  requirements: string | null;
  status: "received";
  receivedAt: string;
};

export type ApiUser = {
  id: string;
  agreementRequired?: boolean;
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

export const BOT_INTEGRATION_SLUGS = [
  "github",
  "slack",
  "linear",
  "terraform",
  "aws",
  "kubernetes",
] as const;

export type BotIntegration = (typeof BOT_INTEGRATION_SLUGS)[number];

export const BOT_INTEGRATIONS: { slug: BotIntegration; label: string }[] = [
  { slug: "github", label: "GitHub" },
  { slug: "slack", label: "Slack" },
  { slug: "linear", label: "Linear" },
  { slug: "terraform", label: "Terraform" },
  { slug: "aws", label: "AWS" },
  { slug: "kubernetes", label: "Kubernetes" },
];

export function isBotIntegration(value: string): value is BotIntegration {
  return (BOT_INTEGRATION_SLUGS as readonly string[]).includes(value);
}

export type Bot = {
  id: string;
  ownerUserId: string;
  name: string;
  description: string;
  specialty: Specialty;
  integrations: BotIntegration[];
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
