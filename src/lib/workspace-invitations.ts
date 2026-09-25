export const WORKSPACE_INVITATION_PATH = "/workspace-invitations/accept";
export const WORKSPACE_INVITATION_TOKEN_KEY = "skaleagents_workspace_invitation";

export const captureWorkspaceInvitationScript = `(() => {
  if (window.location.pathname !== "${WORKSPACE_INVITATION_PATH}" || !window.location.hash.startsWith("#token=")) return;
  const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
  window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
  if (token) {
    window.sessionStorage.setItem("${WORKSPACE_INVITATION_TOKEN_KEY}", token);
    window.dispatchEvent(new Event("workspace-invitation-change"));
  }
})();`;

export function subscribeToWorkspaceInvitation(callback: () => void) {
  window.addEventListener("workspace-invitation-change", callback);
  return () => window.removeEventListener("workspace-invitation-change", callback);
}

export function hasWorkspaceInvitation() {
  return Boolean(window.sessionStorage.getItem(WORKSPACE_INVITATION_TOKEN_KEY));
}

export function clearWorkspaceInvitation() {
  window.sessionStorage.removeItem(WORKSPACE_INVITATION_TOKEN_KEY);
  window.dispatchEvent(new Event("workspace-invitation-change"));
}
