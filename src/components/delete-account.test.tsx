import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "@/lib/api";
import { DeleteAccount } from "./delete-account";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("@/lib/api", async (load) => ({ ...(await load<typeof import("@/lib/api")>()), apiFetch: vi.fn(), ensureCsrfCookie: vi.fn() }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

function renderDelete() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["user"], { id: "alice", email: "alice@example.com", displayName: "Alice" });
  vi.mocked(apiFetch).mockImplementation(async (path: string) => {
    if (path === "/api/user") return { id: "alice", email: "alice@example.com", displayName: "Alice" } as never;
    throw new Error(`unexpected ${path}`);
  });
  render(<QueryClientProvider client={client}><DeleteAccount accountId="alice" /></QueryClientProvider>);
}

it("stays disabled until the account email is typed, in any case", async () => {
  renderDelete();
  const button = await screen.findByRole("button", { name: "Delete my account" });
  expect(button).toBeDisabled();
  fireEvent.change(await screen.findByLabelText(/to confirm/), { target: { value: "ALICE@example.com " } });
  await waitFor(() => expect(button).toBeEnabled());
});

it("lists blockers from the API and keeps the account", async () => {
  renderDelete();
  fireEvent.change(await screen.findByLabelText(/to confirm/), { target: { value: "alice@example.com" } });
  vi.mocked(apiFetch).mockRejectedValueOnce(new ApiError("Your account can't be deleted yet.", 409, ["You own Acme."]));
  fireEvent.click(await screen.findByRole("button", { name: "Delete my account" }));
  expect(await screen.findByText("You own Acme.")).toBeVisible();
  expect(apiFetch).toHaveBeenCalledWith("/api/account", { method: "DELETE", body: JSON.stringify({ accountId: "alice", email: "alice@example.com" }) });
  expect(push).not.toHaveBeenCalled();
});

it("signs out locally and goes home after deleting", async () => {
  renderDelete();
  fireEvent.change(await screen.findByLabelText(/to confirm/), { target: { value: "alice@example.com" } });
  vi.mocked(apiFetch).mockResolvedValueOnce({ deleted: true } as never);
  fireEvent.click(await screen.findByRole("button", { name: "Delete my account" }));
  await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
});
