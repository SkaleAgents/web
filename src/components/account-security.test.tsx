import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { addPasskey } from "@/lib/email-auth";
import { AccountSecurity } from "./account-security";

vi.mock("@/lib/api", async (load) => ({ ...(await load<typeof import("@/lib/api")>()), apiFetch: vi.fn(), ensureCsrfCookie: vi.fn() }));
vi.mock("@/lib/email-auth", async (load) => ({ ...(await load<typeof import("@/lib/email-auth")>()), addPasskey: vi.fn(), deviceName: () => "Mac passkey" }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("adds a passkey under the device name and opens the new row for renaming", async () => {
  const old = { id: "old", name: "Old laptop", created_at: "2026-10-01T00:00:00Z", last_used_at: null };
  vi.mocked(apiFetch).mockResolvedValue({ accountId: "u1", passkeys: [old] } as never);
  vi.mocked(addPasskey).mockResolvedValue({ accountId: "u1", passkeys: [old, { id: "new", name: "Mac passkey", created_at: "2026-10-21T00:00:00Z", last_used_at: null }] });
  const client = new QueryClient();
  client.setQueryData(["user"], { id: "u1" });
  render(<QueryClientProvider client={client}><AccountSecurity accountId="u1" /></QueryClientProvider>);
  expect(screen.queryByLabelText("Passkey name")).toBeNull();
  fireEvent.click(await screen.findByRole("button", { name: "Add a passkey" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Passkey added. Rename it if you'd like.");
  expect(addPasskey).toHaveBeenCalledWith("u1", "Mac passkey");
  expect(screen.getByLabelText("New name for Mac passkey")).toHaveValue("Mac passkey");
  expect(screen.queryByLabelText("New name for Old laptop")).toBeNull();
});

it("emails a reset link, then shows a pending reset that can be cancelled", async () => {
  const key = { id: "k1", name: "Lost key", created_at: "2026-10-01T00:00:00Z", last_used_at: null };
  vi.mocked(apiFetch).mockResolvedValueOnce({ accountId: "u1", resetAt: null, passkeys: [key] } as never).mockResolvedValueOnce(undefined as never);
  const client = new QueryClient();
  client.setQueryData(["user"], { id: "u1" });
  render(<QueryClientProvider client={client}><AccountSecurity accountId="u1" /></QueryClientProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "Email me a reset link" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Check your email for a reset link.");
  expect(apiFetch).toHaveBeenLastCalledWith("/api/account/passkey-reset", expect.objectContaining({ method: "POST", body: JSON.stringify({ accountId: "u1" }) }));

  client.setQueryData(["account-security", "u1"], { accountId: "u1", resetAt: "2026-11-04T03:00:00Z", passkeys: [key] });
  vi.mocked(apiFetch).mockResolvedValueOnce({ accountId: "u1", resetAt: null, passkeys: [key] } as never);
  fireEvent.click(await screen.findByRole("button", { name: "Cancel reset" }));
  expect(await screen.findByText("Passkey reset cancelled.")).toBeInTheDocument();
  expect(apiFetch).toHaveBeenLastCalledWith("/api/account/passkey-reset", { method: "DELETE" });
  expect(screen.queryByRole("button", { name: "Cancel reset" })).toBeNull();
});
