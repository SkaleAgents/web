import { apiFetch, ensureCsrfCookie } from "./api";
import { dashboardDestination } from "./dashboard-routes";
import { hasWorkspaceInvitation, WORKSPACE_INVITATION_PATH } from "./workspace-invitations";

export type AgreementStatus = { termsVersion: string; privacyVersion: string; required: boolean };

export function agreementDestination(next: string | null, oauth: boolean): string {
  if (oauth) return "/oauth/authorize";
  if (hasWorkspaceInvitation()) return WORKSPACE_INVITATION_PATH;
  return dashboardDestination(next);
}

export async function readAgreement(): Promise<AgreementStatus> {
  return apiFetch<AgreementStatus>("/api/account/agreements");
}

export async function acceptAgreement(status: AgreementStatus): Promise<AgreementStatus> {
  await ensureCsrfCookie();
  return apiFetch<AgreementStatus>("/api/account/agreements", {
    method: "POST",
    body: JSON.stringify({ accepted: true, termsVersion: status.termsVersion, privacyVersion: status.privacyVersion }),
  });
}
