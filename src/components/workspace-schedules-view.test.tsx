import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WorkspaceSchedulesPage } from "@/components/workspace-schedules-view";

const schedule = {
  id: "schedule-a", workspaceId: "workspace-a", createdBy: "former-member",
  name: "Weekly security review", cronExpression: "0 0 * * 1", timezone: "UTC",
  scope: { kind: "iac_text", format: "terraform", content: "resource {}" },
  specialists: ["devsecops"], telemetry: null, webhookConfigured: false,
  enabled: false, nextRunAt: null, lastRunAt: null, lastJobId: "job-a",
  lastError: "Paused because the active schedule plan limit was reached",
  retention: { inputAvailable: true, inputPurgeStatus: "retained", inputExpiresAt: null },
  createdAt: "2026-09-25T12:00:00Z", updatedAt: "2026-09-25T12:00:00Z",
};

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

function setup(role: "owner" | "member" | "viewer", enabled = true) {
  vi.stubEnv("NEXT_PUBLIC_WORKSPACE_SCHEDULES_ENABLED", enabled ? "true" : "false");
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(String(input)).pathname;
    if (path === "/api/workspaces") return Response.json({ data: [{ id: "workspace-a", name: "Platform team", role }] });
    if (path === "/api/workspaces/workspace-a/schedules" && init?.method === "POST") return Response.json({ ...schedule, id: "schedule-b", enabled: true }, { status: 201 });
    if (path === "/api/workspaces/workspace-a/schedules") return Response.json({ schedules: [schedule] });
    if (path === "/api/workspaces/workspace-a/schedules/schedule-a" && init?.method === "PATCH") return Response.json({ ...schedule, enabled: true, lastError: null });
    if (path.endsWith("/purge-source")) return Response.json({ cleanupReceiptId: "receipt-a", inputPurgeStatus: "pending", sourcePurged: false }, { status: 202 });
    if (path.endsWith("/schedule-a") && init?.method === "DELETE") return Response.json({ cleanupReceiptId: "receipt-b", status: "pending" }, { status: 202 });
    if (path === "/sanctum/csrf-cookie") return new Response(null, { status: 204 });
    throw new Error(`Unexpected request: ${path}`);
  });
  vi.stubGlobal("fetch", fetcher);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["user"], { id: "account-a", email: "a@example.test", displayName: "Account A" });
  render(<QueryClientProvider client={client}><WorkspaceSchedulesPage workspaceId="workspace-a" /></QueryClientProvider>);
  return fetcher;
}

it("keeps viewers read-only and shows a creator-independent schedule and downgrade reason", async () => {
  setup("viewer");
  expect(await screen.findByText("Weekly security review")).toBeInTheDocument();
  expect(screen.getByText(/active schedule plan limit/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Open last audit" })).toHaveAttribute("href", "/org/workspace-a/jobs");
  expect(screen.queryByRole("button", { name: "Resume" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Purge input" })).not.toBeInTheDocument();
});

it("lets members resume and create while reserving purge and delete for owners", async () => {
  const fetcher = setup("member");
  await userEvent.click(await screen.findByRole("button", { name: "Resume" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("/schedules/schedule-a"), expect.objectContaining({ method: "PATCH" })));
  expect(screen.getByRole("button", { name: "Create schedule" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Purge input" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Delete schedule" })).not.toBeInTheDocument();
});

it("requires an owner confirmation before cleanup and hides controls when rollout is off", async () => {
  const fetcher = setup("owner");
  await userEvent.click(await screen.findByRole("button", { name: "Purge input" }));
  expect(fetcher).not.toHaveBeenCalledWith(expect.stringContaining("purge-source"), expect.anything());
  await userEvent.click(screen.getByRole("button", { name: "Confirm purge" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("purge-source"), expect.objectContaining({ method: "POST" })));
  cleanup();
  vi.unstubAllGlobals();
  setup("owner", false);
  expect(screen.getByText(/not enabled for this deployment/)).toBeInTheDocument();
});
