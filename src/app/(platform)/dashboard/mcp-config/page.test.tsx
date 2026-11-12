import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import McpConfigPage from "./page";
import { apiFetch } from "@/lib/api";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn(), ensureCsrfCookie: vi.fn() }));
vi.mock("@/lib/session", () => ({ currentUserOptions: { queryKey: ["user"], queryFn: async () => ({ id: "u1", displayName: "Owner" }) } }));
// jsdom has no modal dialog support; this is enough for showModal and close to flip the open state.
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; };
afterEach(() => { cleanup(); vi.clearAllMocks(); });

function show(scans: unknown) {
  vi.mocked(apiFetch).mockImplementation(async (path: string) => {
    if (path === "/api/account/entitlements") return scans === "error" ? Promise.reject(new Error("down")) : { mcpScans: scans };
    return { connections: [] };
  });
  render(<QueryClientProvider client={new QueryClient()}><McpConfigPage /></QueryClientProvider>);
}

describe("MCP scan usage", () => {
  it("shows the month's count against the limit", async () => {
    show({ used: 12, limit: 100, enforced: true, resetsAt: "2026-12-01T00:00:00+00:00" });
    expect(await screen.findByRole("heading", { name: "Scans this month" })).toBeVisible();
    expect(screen.getByText(/of/, { selector: "p" })).toHaveTextContent("12 of 100 used.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    // The month resets at 00:00 UTC, so a viewer west of UTC must still see 1 Dec.
    expect(screen.getByText(/Resets/)).toHaveTextContent(/Dec 1, 2026|1 Dec 2026/);
  });

  it("points to plans once the allowance is used up and enforcement is on", async () => {
    show({ used: 100, limit: 100, enforced: true, resetsAt: "2026-12-01T00:00:00+00:00" });
    expect(await screen.findByRole("alert")).toHaveTextContent("You have used all your scans this month.");
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/pricing");
  });

  it("says there is no limit when the account is uncapped and stays quiet when counting is not enforced", async () => {
    show({ used: 400, limit: null, enforced: true, resetsAt: "2026-12-01T00:00:00+00:00" });
    expect(await screen.findByText(/no monthly limit/)).toBeVisible();
    cleanup();
    show({ used: 100, limit: 100, enforced: false, resetsAt: "2026-12-01T00:00:00+00:00" });
    await screen.findByRole("heading", { name: "Scans this month" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("hides the card when the usage answer is missing or fails", async () => {
    show("error");
    await screen.findByRole("heading", { name: "MCP connections" });
    expect(screen.queryByRole("heading", { name: "Scans this month" })).not.toBeInTheDocument();
  });
});

describe("disconnecting a client", () => {
  const connection = { id: "7", clientId: "mcp_x", clientName: "MCP Inspector", createdAt: "2026-11-12T00:00:00Z", lastUsedAt: null, expiresAt: "2026-12-12T00:00:00Z" };
  function showConnection() {
    vi.mocked(apiFetch).mockImplementation(async (path: string, init?: RequestInit) => {
      if (path === "/api/account/entitlements") return {};
      if (init?.method === "DELETE") return { ok: true };
      return { connections: [connection] };
    });
    render(<QueryClientProvider client={new QueryClient()}><McpConfigPage /></QueryClientProvider>);
  }
  const deletes = () => vi.mocked(apiFetch).mock.calls.filter(([, init]) => init?.method === "DELETE");

  it("asks in the page first and does nothing until confirmed", async () => {
    const confirm = vi.spyOn(window, "confirm");
    showConnection();
    fireEvent.click(await screen.findByRole("button", { name: "Disconnect" }));
    const dialog = await screen.findByRole("dialog", { name: "Disconnect MCP Inspector?" });
    expect(dialog).toHaveTextContent("That client loses access until it connects again.");
    expect(deletes()).toHaveLength(0);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("cancels without calling the API", async () => {
    showConnection();
    fireEvent.click(await screen.findByRole("button", { name: "Disconnect" }));
    const dialog = await screen.findByRole("dialog", { name: "Disconnect MCP Inspector?" });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(dialog).not.toHaveAttribute("open"));
    expect(deletes()).toHaveLength(0);
  });

  it("disconnects the chosen client once the dialog is confirmed", async () => {
    showConnection();
    fireEvent.click(await screen.findByRole("button", { name: "Disconnect" }));
    const dialog = await screen.findByRole("dialog", { name: "Disconnect MCP Inspector?" });
    fireEvent.click(Array.from(dialog.querySelectorAll("button")).find((button) => button.textContent === "Disconnect")!);
    await waitFor(() => expect(deletes()).toHaveLength(1));
    expect(deletes()[0][0]).toBe("/api/oauth/connections/7");
  });
});
