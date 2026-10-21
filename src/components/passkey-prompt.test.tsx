import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { addPasskey } from "@/lib/email-auth";
import { offerPasskeyAfterSignIn, PasskeyPrompt } from "./passkey-prompt";

vi.mock("@/lib/api", async (load) => ({ ...(await load<typeof import("@/lib/api")>()), apiFetch: vi.fn(), ensureCsrfCookie: vi.fn() }));
vi.mock("@/lib/email-auth", async (load) => ({ ...(await load<typeof import("@/lib/email-auth")>()), addPasskey: vi.fn(), deviceName: () => "Mac passkey" }));

beforeEach(() => {
  vi.stubGlobal("PublicKeyCredential", class {});
  vi.stubGlobal("isSecureContext", true);
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; };
});
afterEach(() => { cleanup(); sessionStorage.clear(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

const saved = { id: "p1", name: "Mac passkey", created_at: "2026-10-21T00:00:00Z", last_used_at: null };

function renderPrompt(passkeys: unknown[]) {
  vi.mocked(apiFetch).mockImplementation(async (path: string, init?: RequestInit) => (path === "/api/user"
    ? { id: "u1", agreementRequired: false }
    : init?.method === "PATCH" ? { accountId: "u1", passkeys: [{ ...saved, name: JSON.parse(String(init.body)).name }] }
      : { accountId: "u1", passkeys }) as never);
  render(<QueryClientProvider client={new QueryClient()}><PasskeyPrompt /></QueryClientProvider>);
}

it("offers a passkey in a dialog after an emailed sign-in link, and Not now hides it for the session", async () => {
  offerPasskeyAfterSignIn();
  renderPrompt([]);
  expect(await screen.findByRole("heading", { name: "Add a passkey (highly recommended)" })).toBeVisible();
  expect(screen.getByRole("dialog")).toHaveAttribute("open");
  expect(screen.queryByLabelText("Passkey name")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Not now" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Add a passkey" })).toBeNull());
  expect(sessionStorage.getItem("skale:offer-passkey")).toBeNull();
  cleanup();
  vi.mocked(apiFetch).mockClear();
  renderPrompt([]);
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(apiFetch).not.toHaveBeenCalledWith("/api/account/passkeys", expect.anything());
});

it("saves the passkey under the device name first, then renames it only when the name changes", async () => {
  vi.mocked(addPasskey).mockResolvedValue({ accountId: "u1", passkeys: [saved] });
  renderPrompt([]);
  fireEvent.click(await screen.findByRole("button", { name: "Add a passkey" }));
  expect(await screen.findByRole("heading", { name: "Passkey added" })).toBeVisible();
  expect(addPasskey).toHaveBeenCalledWith("u1", "Mac passkey");
  const field = screen.getByLabelText("Passkey name");
  expect(field).toHaveValue("Mac passkey");
  fireEvent.change(field, { target: { value: "Desk Mac" } });
  fireEvent.click(screen.getByRole("button", { name: "Save name" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(apiFetch).toHaveBeenCalledWith("/api/account/passkeys/p1", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ accountId: "u1", name: "Desk Mac" }) }));
  expect(sessionStorage.getItem("skale:passkey-prompt-dismissed")).toBe("1");
});

it("Keep name closes without a rename request", async () => {
  vi.mocked(addPasskey).mockResolvedValue({ accountId: "u1", passkeys: [saved] });
  renderPrompt([]);
  fireEvent.click(await screen.findByRole("button", { name: "Add a passkey" }));
  fireEvent.click(await screen.findByRole("button", { name: "Keep name" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(apiFetch).not.toHaveBeenCalledWith(expect.stringContaining("/api/account/passkeys/p1"), expect.anything());
});

it("recommends a passkey to Google and GitHub accounts too, but not when one exists", async () => {
  renderPrompt([]);
  expect(await screen.findByRole("heading", { name: "Protect your account with a passkey" })).toBeVisible();
  cleanup();
  renderPrompt([{ id: "p1", name: "Mac", created_at: "", last_used_at: null }]);
  await waitFor(() => expect(apiFetch).toHaveBeenCalledWith("/api/account/passkeys", expect.anything()));
  expect(screen.queryByRole("button", { name: "Add a passkey" })).toBeNull();
});
