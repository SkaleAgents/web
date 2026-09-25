import { ApiError, apiFetch, ensureCsrfCookie, type SwarmJob } from "@/lib/api";

export type WorkspaceRole = "owner" | "member" | "viewer";

export type AuditWorkspace = {
  id: string;
  name: string;
  createdAt: string;
  role: WorkspaceRole;
};

export type WorkspaceAudit = SwarmJob & {
  workspaceId: string;
  retention?: NonNullable<SwarmJob["retention"]>;
};

export type WorkspaceAuditDetail = WorkspaceAudit & {
  findings?: NonNullable<SwarmJob["findings"]>;
  tasks?: NonNullable<SwarmJob["tasks"]>;
  steps?: NonNullable<SwarmJob["steps"]>;
};

export function workspaceAuditsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_WORKSPACE_AUDITS_ENABLED === "true";
}

export function workspaceAuditPath(workspaceId: string, auditId?: string): string {
  return `/api/workspaces/${encodeURIComponent(workspaceId)}/audits${auditId ? `/${encodeURIComponent(auditId)}` : ""}`;
}

export async function listWorkspaceAudits(workspaceId: string, signal?: AbortSignal): Promise<WorkspaceAudit[]> {
  const response = await apiFetch<{ data: WorkspaceAudit[] }>(workspaceAuditPath(workspaceId), { signal });
  return response.data;
}

export async function createWorkspaceAudit(workspaceId: string, content: string): Promise<WorkspaceAudit> {
  await ensureCsrfCookie();
  return apiFetch<WorkspaceAudit>(workspaceAuditPath(workspaceId), {
    method: "POST",
    body: JSON.stringify({ scope: { kind: "iac_text", format: "auto", content }, specialists: ["devsecops", "sre"] }),
  });
}

export async function getWorkspaceAudit(workspaceId: string, auditId: string, signal?: AbortSignal): Promise<WorkspaceAuditDetail> {
  return apiFetch<WorkspaceAuditDetail>(workspaceAuditPath(workspaceId, auditId), { signal });
}

export async function purgeWorkspaceAuditSource(workspaceId: string, auditId: string) {
  await ensureCsrfCookie();
  return apiFetch<{
    ok: true;
    sourcePurged: boolean;
    inputPurgeStatus: "purged" | "pending" | "failed";
    cleanupReceiptId: string;
    retention: WorkspaceAudit["retention"] | null;
  }>(`${workspaceAuditPath(workspaceId, auditId)}/purge-source`, { method: "POST" });
}

export async function deleteWorkspaceAudit(workspaceId: string, auditId: string, signal?: AbortSignal) {
  await ensureCsrfCookie(signal);
  return apiFetch<void | { cleanupReceiptId: string; status: "pending" | "failed" }>(workspaceAuditPath(workspaceId, auditId), { method: "DELETE", signal });
}

export function isWorkspaceAuditUnavailable(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}
