import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import PasskeyResetPage from "./page";

vi.mock("@/lib/api", async (original) => ({ ...await original<typeof import("@/lib/api")>(), apiFetch: vi.fn(), ensureCsrfCookie: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); delete window.__skalePasskeyResetToken; });

const user = { id: "u1", displayName: "Ada", email: "ada@example.com", grokSubject: null };

function renderPage(token?: string) {
  window.__skalePasskeyResetToken = token;
  const client = new QueryClient();
  client.setQueryData(currentUserOptions.queryKey, user);
  render(<QueryClientProvider client={client}><PasskeyResetPage /></QueryClientProvider>);
  return client;
}

it("confirms the reset once and shows when the passkeys go", async () => {
  vi.mocked(apiFetch).mockResolvedValueOnce({ accountId: "u1", resetAt: "2026-11-04T03:00:00Z", passkeys: [] });
  const client = renderPage("a".repeat(64));
  expect(await screen.findByText(/Every passkey will be removed on/)).toHaveTextContent("You can cancel in Settings");
  cleanup();
  render(<QueryClientProvider client={client}><PasskeyResetPage /></QueryClientProvider>);
  await screen.findByText(/Every passkey will be removed on/);
  expect(apiFetch).toHaveBeenCalledOnce();
  expect(apiFetch).toHaveBeenCalledWith("/api/account/passkey-reset/confirm", expect.objectContaining({ body: JSON.stringify({ token: "a".repeat(64) }) }));
});

it("explains a missing link", async () => {
  renderPage();
  expect(await screen.findByRole("alert")).toHaveTextContent("Open the link from your email again.");
  expect(apiFetch).not.toHaveBeenCalled();
});
