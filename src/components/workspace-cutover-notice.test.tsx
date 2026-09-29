import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceCutoverNoticeView } from "@/components/workspace-cutover-notice";
import { WorkspacesView } from "@/components/workspaces-view";
import { apiFetch, ensureCsrfCookie } from "@/lib/api";

vi.mock("@/lib/api", async (load) => ({ ...await load<typeof import("@/lib/api")>(), apiFetch: vi.fn(), ensureCsrfCookie: vi.fn() }));

const workspaceId = "00000000-0000-4000-8000-000000000001";
const notice = {
  workspaceId,
  version: "free-org-v1",
  contentHash: "a".repeat(64),
  effectiveAt: "2026-11-01T00:00:00+00:00",
  body: "Free organization audits: two accepted audits per UTC calendar month from November 1, 2026.",
  billingUrl: "https://skaleagents.com/dashboard/billing",
  supportUrl: "https://skaleagents.com/contact",
  acknowledgementEnabled: true,
  acknowledgedAt: null,
  noticeToken: "encrypted-token",
};

function renderNotice(accountId = "owner-a") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(["user"], { id: accountId, name: "Owner" });
  const view = render(<QueryClientProvider client={client}><WorkspaceCutoverNoticeView workspaceId={workspaceId} /></QueryClientProvider>);
  return { client, ...view };
}

describe("Free organization cutover notice", () => {
  beforeEach(() => { vi.mocked(apiFetch).mockReset(); vi.mocked(ensureCsrfCookie).mockReset(); });
  afterEach(() => cleanup());

  it("shows the exact notice and records the API-confirmed receipt for an owner without email", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(notice)
      .mockResolvedValueOnce({ ...notice, acknowledgedAt: "2026-10-01T12:00:00+00:00" });
    renderNotice();

    expect(await screen.findByText(notice.body)).toBeVisible();
    expect(screen.getByText(/November 1, 2026.*UTC/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Record that I have read this notice" }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith(`/api/workspaces/${workspaceId}/cutover-notice/acknowledge`, expect.objectContaining({
      method: "POST", body: JSON.stringify({ workspaceId, noticeToken: "encrypted-token" }),
    })));
    expect(ensureCsrfCookie).toHaveBeenCalledOnce();
    expect(await screen.findByText(/Notice recorded/)).toBeVisible();
  });

  it("keeps an unsuccessful acknowledgement pending and offers retry", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(notice).mockRejectedValueOnce(new Error("Connection lost"));
    renderNotice();
    fireEvent.click(await screen.findByRole("button", { name: "Record that I have read this notice" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Connection lost");
    expect(screen.queryByText(/Notice recorded/)).not.toBeInTheDocument();
  });

  it("does not offer recording while acknowledgement is disabled", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ ...notice, acknowledgementEnabled: false });
    renderNotice();
    expect(await screen.findByText(/Notice recording is not available yet/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Record that I have read this notice" })).not.toBeInTheDocument();
  });

  it("does not show a former account notice after switching accounts", async () => {
    let resolveOld!: (value: typeof notice) => void;
    vi.mocked(apiFetch).mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve as typeof resolveOld; }))
      .mockResolvedValueOnce({ ...notice, body: "Notice for the new owner." });
    const { client } = renderNotice();
    await act(async () => { client.setQueryData(["user"], { id: "owner-b", name: "New owner" }); });
    await act(async () => { resolveOld(notice); });

    expect(await screen.findByText("Notice for the new owner.")).toBeVisible();
    expect(screen.queryByText(notice.body)).not.toBeInTheDocument();
  });

  it("rejects a notice response for another organization", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ ...notice, workspaceId: "00000000-0000-4000-8000-000000000002" });
    renderNotice();
    expect(await screen.findByRole("alert")).toHaveTextContent(/organization changed/i);
    expect(screen.queryByRole("button", { name: "Record that I have read this notice" })).not.toBeInTheDocument();
  });

  it("shows an owner link only when the publication is available", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ data: [
      { id: workspaceId, name: "Free organization", kind: "team", role: "owner", cutoverNoticeAvailable: true, createdAt: "2026-09-28T11:00:00Z" },
      { id: "00000000-0000-4000-8000-000000000002", name: "Unpublished", kind: "team", role: "owner", cutoverNoticeAvailable: false, createdAt: "2026-09-28T11:00:00Z" },
      { id: "00000000-0000-4000-8000-000000000003", name: "Member", kind: "team", role: "member", cutoverNoticeAvailable: false, createdAt: "2026-09-28T11:00:00Z" },
    ] });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(["user"], { id: "owner-a", name: "Owner" });
    render(<QueryClientProvider client={client}><WorkspacesView /></QueryClientProvider>);
    const links = await screen.findAllByRole("link", { name: "Review Free plan notice" });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", `/org/${workspaceId}/settings/cutover-notice`);
  });
});
