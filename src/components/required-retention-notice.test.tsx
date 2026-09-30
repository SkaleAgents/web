import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RequiredRetentionNotice } from "./required-retention-notice";
import { apiFetch, ensureCsrfCookie } from "@/lib/api";

vi.mock("@/lib/api", async load => ({ ...await load<typeof import("@/lib/api")>(), apiFetch: vi.fn(), ensureCsrfCookie: vi.fn() }));
const policy = { accountId: "owner", enabled: false, acknowledgementEnabled: true, notice: ["Audit history is retained for 30 days."], noticeToken: "token", noticeArchived: false, version: "v1", noticeDeliveredAt: null, legacyNotBefore: null };
function mount(workspaceId?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(["user"], { id: "owner" });
  const view = render(<QueryClientProvider client={client}><RequiredRetentionNotice accountId="owner" workspaceId={workspaceId} /></QueryClientProvider>);
  return { client, ...view };
}
beforeEach(() => {
  vi.mocked(apiFetch).mockReset();
  vi.mocked(ensureCsrfCookie).mockReset();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(cleanup);
it("requires acknowledgement and ignores cancellation until the archive confirms success", async () => {
  vi.mocked(apiFetch).mockResolvedValueOnce(policy).mockResolvedValueOnce({ ...policy, noticeDeliveredAt: "2026-09-30T00:00:00Z" }).mockResolvedValueOnce({ ...policy, noticeArchived: true });
  mount();
  const dialog = await screen.findByRole("dialog", { name: "Audit retention policy" });
  const cancel = new Event("cancel", { cancelable: true });
  fireEvent(dialog, cancel);
  expect(cancel.defaultPrevented).toBe(true);
  fireEvent.click(dialog);
  expect(dialog).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "I acknowledge" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/not confirmed/i);
  expect(dialog).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "I acknowledge" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(apiFetch).toHaveBeenCalledWith("/api/account/retention/acknowledge", expect.objectContaining({ body: JSON.stringify({ accountId: "owner", noticeToken: "token" }) }));
});
it.each([{ ...policy, acknowledgementEnabled: false }, { ...policy, noticeArchived: true }])("does not show a disabled or archived notice", async data => {
  vi.mocked(apiFetch).mockResolvedValue(data);
  const { client } = mount();
  await waitFor(() => expect(client.getQueryState(["retention-policy", "owner"])?.status).toBe("success"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("queues the owner organization notice after the account notice", async () => {
  vi.mocked(apiFetch).mockImplementation(async (path, init) => {
    if (path === "/api/account/retention") return policy;
    if (path === "/api/account/retention/acknowledge") return { ...policy, noticeArchived: true };
    return { ...policy, workspaceId: "org", automaticRetentionEnabled: false, noticeArchived: init?.method === "POST" };
  });
  mount("org");
  await screen.findByRole("dialog", { name: "Audit retention policy" });
  expect(apiFetch).not.toHaveBeenCalledWith("/api/workspaces/org/retention", expect.anything());
  fireEvent.click(screen.getByRole("button", { name: "I acknowledge" }));
  await screen.findByRole("dialog", { name: "Organization audit retention" });
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "I acknowledge" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});
it("keeps the notice open after a failed save and allows retry", async () => {
  vi.mocked(apiFetch).mockResolvedValueOnce(policy).mockRejectedValueOnce(new Error("Please try again"));
  mount();
  fireEvent.click(await screen.findByRole("button", { name: "I acknowledge" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Please try again");
  expect(screen.getByRole("dialog")).toBeVisible();
});
it("rejects a response for a different account", async () => {
  vi.mocked(apiFetch).mockResolvedValueOnce({ ...policy, accountId: "other" });
  const { client } = mount();
  await waitFor(() => expect(client.getQueryState(["retention-policy", "owner"])?.status).toBe("error"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("still checks the organization notice when the account policy is unavailable", async () => {
  vi.mocked(apiFetch).mockImplementation(async path => {
    if (path === "/api/account/retention") throw new Error("Unavailable");
    return { ...policy, workspaceId: "org", automaticRetentionEnabled: false };
  });
  mount("org");
  expect(await screen.findByRole("dialog", { name: "Organization audit retention" })).toBeVisible();
});
it("ignores acknowledgement completion after the signed-in account changes", async () => {
  let complete!: (data: unknown) => void;
  vi.mocked(apiFetch).mockResolvedValueOnce(policy).mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
  const { client } = mount();
  fireEvent.click(await screen.findByRole("button", { name: "I acknowledge" }));
  await waitFor(() => expect(complete).toBeDefined());
  client.setQueryData(["user"], { id: "other" });
  complete({ ...policy, noticeArchived: true });
  expect(await screen.findByRole("alert")).toHaveTextContent(/account or organization changed/);
  expect(client.getQueryData(["retention-policy", "owner"])).toMatchObject({ noticeArchived: false });
});
