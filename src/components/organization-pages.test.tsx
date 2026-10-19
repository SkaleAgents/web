import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { OrganizationSettings } from "@/components/organization-pages";
import { apiFetch } from "@/lib/api";

vi.mock("@/lib/api", async (load) => ({ ...(await load<typeof import("@/lib/api")>()), apiFetch: vi.fn(), ensureCsrfCookie: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

function showSettings(role: "owner" | "member" = "owner") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(["user"], { id: "owner-1", email: "owner@example.test", displayName: "Owner" });
  vi.mocked(apiFetch).mockImplementation(async (path, init) => {
    if (path === "/api/workspaces/org-1" && init?.method === "PATCH") return { data: { id: "org-1", name: "New Name", role } } as never;
    if (path === "/api/workspaces/org-1") return { data: { id: "org-1", name: "Old Name", role } } as never;
    if (path === "/api/workspaces/org-1/members" && !init?.method) return { data: [
      { userId: "owner-1", email: "owner@example.test", name: "Owner", role: "owner", joinedAt: "2026-09-01T00:00:00Z" },
      { userId: "member-1", email: "member@example.test", name: "Member", role: "member", joinedAt: "2026-09-02T00:00:00Z" },
    ] } as never;
    if (path === "/api/workspaces/org-1/invitations" && !init?.method) return { data: [] } as never;
    if (path === "/api/workspaces/org-1/invitations" && init?.method === "POST") return { data: { id: "invite-1", email: "new@example.test", role: "viewer", status: "pending", expiresAt: "2026-10-06T00:00:00Z" } } as never;
    if (path === "/api/workspaces/org-1/members/member-1" && init?.method === "PATCH") return { data: { userId: "member-1", role: "viewer" } } as never;
    if (path === "/api/workspaces/org-1/members/member-1" && init?.method === "DELETE") return undefined as never;
    if (path === "/api/workspaces/org-1/invitations/invite-1" && init?.method === "DELETE") return undefined as never;
    throw new Error(`Unexpected request: ${path}`);
  });
  render(<QueryClientProvider client={client}><OrganizationSettings workspaceId="org-1" /></QueryClientProvider>);
  return client;
}

it("lets an owner rename an organization and manage members and invitations", async () => {
  const user = userEvent.setup();
  const client = showSettings();
  expect(await screen.findByDisplayValue("Old Name")).toBeVisible();
  expect(screen.getByRole("heading", { name: "Delete organization" })).toBeVisible();
  await user.clear(screen.getByLabelText("Organization name"));
  await user.type(screen.getByLabelText("Organization name"), "New Name");
  await user.click(screen.getByRole("button", { name: "Save name" }));
  await waitFor(() => expect(client.getQueryData<{ name: string }>(["organization", "owner-1", "org-1"])?.name).toBe("New Name"));

  expect(await screen.findByText("member@example.test")).toBeVisible();
  await user.selectOptions(screen.getByLabelText("Role for member@example.test"), "viewer");
  await waitFor(() => expect(apiFetch).toHaveBeenCalledWith("/api/workspaces/org-1/members/member-1", expect.objectContaining({ method: "PATCH" })));
  await user.type(screen.getByLabelText("Invite email"), "new@example.test");
  await user.selectOptions(screen.getByLabelText("Invite role"), "viewer");
  await user.click(screen.getByRole("button", { name: "Send invitation" }));
  expect(await screen.findByText("new@example.test")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Revoke invitation for new@example.test" }));
  await waitFor(() => expect(apiFetch).toHaveBeenCalledWith("/api/workspaces/org-1/invitations/invite-1", expect.objectContaining({ method: "DELETE" })));
  await user.click(screen.getByRole("button", { name: "Remove member@example.test" }));
  await waitFor(() => expect(apiFetch).toHaveBeenCalledWith("/api/workspaces/org-1/members/member-1", expect.objectContaining({ method: "DELETE" })));
}, 15000);

it("shows organization details without owner controls to a member", async () => {
  showSettings("member");
  expect(await screen.findByText("Old Name")).toBeVisible();
  expect(screen.queryByRole("heading", { name: "Delete organization" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Save name" })).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Invite email")).not.toBeInTheDocument();
  expect(apiFetch).not.toHaveBeenCalledWith("/api/workspaces/org-1/members", expect.anything());
});
