import { ApiError, apiFetch, ensureCsrfCookie, type SwarmSchedule } from "@/lib/api";

export type WorkspaceSchedule = SwarmSchedule & { workspaceId: string; createdBy: string | null };
export type WorkspaceScheduleInput = {
  name: string;
  cronExpression: string;
  timezone: string;
  scope: { kind: "iac_text"; format: "terraform" | "cloudformation" | "kubernetes" | "auto"; content: string };
  specialists: string[];
  enabled?: boolean;
};
export type ScheduleCleanup = { cleanupReceiptId: string; status?: "pending" | "failed"; inputPurgeStatus?: "pending" | "failed" | "purged" };

export function workspaceSchedulesEnabled() {
  return process.env.NEXT_PUBLIC_WORKSPACE_SCHEDULES_ENABLED === "true";
}

function path(workspaceId: string, scheduleId?: string) {
  const base = `/api/workspaces/${encodeURIComponent(workspaceId)}/schedules`;
  return scheduleId ? `${base}/${encodeURIComponent(scheduleId)}` : base;
}

export async function listWorkspaceSchedules(workspaceId: string, signal?: AbortSignal) {
  const response = await apiFetch<{ schedules: WorkspaceSchedule[] }>(path(workspaceId), { signal });
  if (response.schedules.some((schedule) => schedule.workspaceId !== workspaceId)) {
    throw new ApiError("The schedule list did not match this organization.", 404);
  }
  return response.schedules;
}

export async function createWorkspaceSchedule(workspaceId: string, input: WorkspaceScheduleInput) {
  await ensureCsrfCookie();
  return apiFetch<WorkspaceSchedule>(path(workspaceId), { method: "POST", body: JSON.stringify(input) });
}

export async function updateWorkspaceSchedule(workspaceId: string, scheduleId: string, input: Partial<WorkspaceScheduleInput>) {
  await ensureCsrfCookie();
  return apiFetch<WorkspaceSchedule>(path(workspaceId, scheduleId), { method: "PATCH", body: JSON.stringify(input) });
}

export async function purgeWorkspaceSchedule(workspaceId: string, scheduleId: string) {
  await ensureCsrfCookie();
  return apiFetch<ScheduleCleanup>(`${path(workspaceId, scheduleId)}/purge-source`, { method: "POST" });
}

export async function deleteWorkspaceSchedule(workspaceId: string, scheduleId: string) {
  await ensureCsrfCookie();
  return apiFetch<ScheduleCleanup | undefined>(path(workspaceId, scheduleId), { method: "DELETE" });
}
