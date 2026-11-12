import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import McpConfigPage from "./page";
import { apiFetch } from "@/lib/api";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn(), ensureCsrfCookie: vi.fn() }));
vi.mock("@/lib/session", () => ({ currentUserOptions: { queryKey: ["user"], queryFn: async () => ({ id: "u1", displayName: "Owner" }) } }));
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
