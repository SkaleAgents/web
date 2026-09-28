import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceRetentionNoticeView } from "@/components/workspace-retention-notice";
import { WorkspacesView } from "@/components/workspaces-view";
import { apiFetch, ensureCsrfCookie } from "@/lib/api";

vi.mock("@/lib/api", async (load) => ({ ...await load<typeof import("@/lib/api")>(), apiFetch: vi.fn(), ensureCsrfCookie: vi.fn() }));

const workspaceId = "00000000-0000-4000-8000-000000000001";
const policy = {
  workspaceId,
  acknowledgementEnabled: false,
  automaticRetentionEnabled: false,
  version: "audit-minimal-v1",
  notice: ["Organization audits have a 30-day history window."],
  contentHash: "c".repeat(64),
  activationNotice: "Acknowledging does not activate cleanup.",
  noticeDeliveredAt: null,
  legacyNotBefore: null,
  noticeArchived: false,
  noticeToken: "encrypted-token",
};

function renderNotice() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(["user"], { id: "owner-a", name: "Owner A" });
  return render(<QueryClientProvider client={client}><WorkspaceRetentionNoticeView workspaceId={workspaceId} /></QueryClientProvider>);
}

describe("organization retention notice", () => {
  beforeEach(() => { vi.mocked(apiFetch).mockReset(); vi.mocked(ensureCsrfCookie).mockReset(); });
  afterEach(() => cleanup());

  it("shows the policy without offering acknowledgement while recording is disabled", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(policy);
    renderNotice();
    expect(await screen.findByText(policy.notice[0])).toBeVisible();
    expect(screen.getByText(/recording is not available/i)).toBeVisible();
    expect(screen.queryByRole("button", { name: /record notice/i })).not.toBeInTheDocument();
    expect(ensureCsrfCookie).not.toHaveBeenCalled();
  });

  it("records only the current organization notice when the API enables it", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ ...policy, acknowledgementEnabled: true })
      .mockResolvedValueOnce({ ...policy, acknowledgementEnabled: true, noticeDeliveredAt: "2026-09-28T11:00:00Z", legacyNotBefore: "2026-10-28T11:00:00Z", noticeArchived: true });
    renderNotice();
    fireEvent.click(await screen.findByRole("button", { name: "Record notice" }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith(`/api/workspaces/${workspaceId}/retention/acknowledge`, expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ workspaceId, noticeToken: "encrypted-token" }),
    })));
    expect(ensureCsrfCookie).toHaveBeenCalledOnce();
    expect(await screen.findByText(/Notice recorded/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Record notice" })).not.toBeInTheDocument();
  });

  it("rejects a policy response from another organization", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ ...policy, workspaceId: "00000000-0000-4000-8000-000000000002" });
    renderNotice();
    expect(await screen.findByRole("alert")).toHaveTextContent(/organization changed/i);
    expect(screen.queryByRole("button", { name: "Record notice" })).not.toBeInTheDocument();
  });

  it("links owners to their notice without adding the link for members", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ data: [
      { id: workspaceId, name: "Owned organization", role: "owner", createdAt: "2026-09-28T11:00:00Z" },
      { id: "00000000-0000-4000-8000-000000000002", name: "Member organization", role: "member", createdAt: "2026-09-28T11:00:00Z" },
    ] });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(["user"], { id: "owner-a", name: "Owner A" });
    render(<QueryClientProvider client={client}><WorkspacesView /></QueryClientProvider>);
    const link = await screen.findByRole("link", { name: "View audit retention notice" });
    expect(link).toHaveAttribute("href", `/dashboard/workspaces/${workspaceId}/retention`);
    expect(screen.getAllByRole("link", { name: "View audit retention notice" })).toHaveLength(1);
  });
});
