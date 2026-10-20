import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import ConfirmEmailChangePage from "./page";

vi.mock("@/lib/api", async (original) => ({ ...await original<typeof import("@/lib/api")>(), apiFetch: vi.fn(), ensureCsrfCookie: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); delete window.__skaleEmailChangeToken; });

const user = { id: "u1", displayName: "Ada", email: "old@example.com", grokSubject: null };

function renderPage(token?: string) {
  window.__skaleEmailChangeToken = token;
  const client = new QueryClient();
  client.setQueryData(currentUserOptions.queryKey, user);
  render(<QueryClientProvider client={client}><ConfirmEmailChangePage /></QueryClientProvider>);
  return client;
}

it("confirms the token once, even if the page remounts, and updates the signed-in user", async () => {
  vi.mocked(apiFetch).mockResolvedValueOnce({ ...user, email: "new@example.com" });
  const client = renderPage("a".repeat(64));
  expect(await screen.findByText(/Your email is now/)).toHaveTextContent("new@example.com");
  cleanup();
  render(<QueryClientProvider client={client}><ConfirmEmailChangePage /></QueryClientProvider>);
  expect(await screen.findByText(/Your email is now/)).toHaveTextContent("new@example.com");
  expect(apiFetch).toHaveBeenCalledOnce();
  expect(apiFetch).toHaveBeenCalledWith("/api/account/email/confirm", expect.objectContaining({ body: JSON.stringify({ token: "a".repeat(64) }) }));
  expect(client.getQueryData(currentUserOptions.queryKey)).toMatchObject({ email: "new@example.com" });
});

it("explains a missing or rejected link", async () => {
  renderPage();
  expect(await screen.findByRole("alert")).toHaveTextContent("Open the link from your email again.");
  expect(apiFetch).not.toHaveBeenCalled();
});
