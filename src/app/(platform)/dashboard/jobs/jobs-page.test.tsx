import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import JobsPage from "./page";
import { setSessionUser } from "@/lib/session";

vi.mock("next/navigation", () => ({ usePathname: () => "/org/00000000-0000-4000-8000-000000000002/jobs", useRouter: () => ({ push: vi.fn() }) }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("keeps the audit history scannable and opens full controls on a detail page", async () => {
  const jobId = "00000000-0000-4000-8000-000000000001";
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/api/jobs")) return Response.json({ jobs: [{
      id: jobId, status: "completed", summary: "Ingress review", requestedBy: "owner", dispatchActor: "scheduler",
      sourcePurged: false, specialists: ["devsecops"], partial: false, scope: {},
      createdAt: "2026-09-28T12:00:00Z", updatedAt: "2026-09-28T12:00:00Z",
    }] });
    if (url.endsWith("/api/account/retention")) return Response.json({ accountId: "owner", enabled: false });
    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;
  vi.stubGlobal("fetch", fetcher);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await setSessionUser(client, { id: "owner", displayName: "Owner", email: null, grokSubject: null });

  render(<QueryClientProvider client={client}><JobsPage /></QueryClientProvider>);

  expect(await screen.findByText("Ingress review")).toBeInTheDocument();
  expect(screen.getByText(/Scheduled run/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "View audit" })).toHaveAttribute("href", `/org/00000000-0000-4000-8000-000000000002/jobs/${jobId}`);
  expect(screen.queryByRole("button", { name: "Export report" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Delete audit" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Open Watchtower" })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Retention policy" })).not.toBeInTheDocument();
  expect(screen.queryByText(/Audit retention policy/)).not.toBeInTheDocument();
});

it("still lists an audit whose specialists are missing", async () => {
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/api/jobs")) return Response.json({ jobs: [{ id: "00000000-0000-4000-8000-000000000003", status: "queued", summary: "Bare job", requestedBy: "owner", sourcePurged: false, partial: false, scope: {}, createdAt: "2026-09-28T12:00:00Z", updatedAt: "2026-09-28T12:00:00Z" }] });
    if (url.endsWith("/api/account/retention")) return Response.json({ accountId: "owner", enabled: false });
    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;
  vi.stubGlobal("fetch", fetcher);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await setSessionUser(client, { id: "owner", displayName: "Owner", email: null, grokSubject: null });
  render(<QueryClientProvider client={client}><JobsPage /></QueryClientProvider>);
  expect(await screen.findByText("Bare job")).toBeInTheDocument();
});
