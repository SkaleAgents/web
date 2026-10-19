import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { offerPasskeyAfterSignIn, PasskeyPrompt } from "./passkey-prompt";

vi.mock("@/lib/api", async (load) => ({ ...(await load<typeof import("@/lib/api")>()), apiFetch: vi.fn() }));

beforeEach(() => {
  vi.stubGlobal("PublicKeyCredential", class {});
  vi.stubGlobal("isSecureContext", true);
});
afterEach(() => { cleanup(); sessionStorage.clear(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

function renderPrompt(passkeys: unknown[]) {
  vi.mocked(apiFetch).mockImplementation(async (path: string) => (path === "/api/user"
    ? { id: "u1", agreementRequired: false }
    : { accountId: "u1", passkeys }) as never);
  render(<QueryClientProvider client={new QueryClient()}><PasskeyPrompt /></QueryClientProvider>);
}

it("offers a passkey after an emailed sign-in link, and Not now hides it for the session", async () => {
  offerPasskeyAfterSignIn();
  renderPrompt([]);
  expect(await screen.findByRole("heading", { name: "Add a passkey (highly recommended)" })).toBeVisible();
  expect(screen.getByLabelText("Passkey name")).toBeVisible();
  screen.getByRole("button", { name: "Not now" }).click();
  await waitFor(() => expect(screen.queryByRole("button", { name: "Add a passkey" })).toBeNull());
  expect(sessionStorage.getItem("skale:offer-passkey")).toBeNull();
  cleanup();
  vi.mocked(apiFetch).mockClear();
  renderPrompt([]);
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(apiFetch).not.toHaveBeenCalledWith("/api/account/passkeys", expect.anything());
});

it("recommends a passkey to Google and GitHub accounts too, but not when one exists", async () => {
  renderPrompt([]);
  expect(await screen.findByRole("heading", { name: "Protect your account with a passkey" })).toBeVisible();
  cleanup();
  renderPrompt([{ id: "p1", name: "Mac", created_at: "", last_used_at: null }]);
  await waitFor(() => expect(apiFetch).toHaveBeenCalledWith("/api/account/passkeys", expect.anything()));
  expect(screen.queryByRole("button", { name: "Add a passkey" })).toBeNull();
});
