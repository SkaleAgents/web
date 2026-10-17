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
    : { accountId: "u1", hasPassword: false, passkeys }) as never);
  render(<QueryClientProvider client={new QueryClient()}><PasskeyPrompt /></QueryClientProvider>);
}

it("offers a passkey after an emailed sign-in link when the account has none", async () => {
  offerPasskeyAfterSignIn();
  renderPrompt([]);
  expect(await screen.findByRole("button", { name: "Add a passkey" })).toBeVisible();
  screen.getByRole("button", { name: "Not now" }).click();
  await waitFor(() => expect(screen.queryByRole("button", { name: "Add a passkey" })).toBeNull());
  expect(sessionStorage.getItem("skale:offer-passkey")).toBeNull();
});

it("stays hidden when the account already has a passkey or no link was used", async () => {
  offerPasskeyAfterSignIn();
  renderPrompt([{ id: "p1", name: "Mac", created_at: "", last_used_at: null }]);
  await waitFor(() => expect(sessionStorage.getItem("skale:offer-passkey")).toBeNull());
  expect(screen.queryByRole("button", { name: "Add a passkey" })).toBeNull();
  cleanup();
  vi.mocked(apiFetch).mockClear();
  renderPrompt([]);
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(apiFetch).not.toHaveBeenCalledWith("/api/account/passkeys", expect.anything());
});
