import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WorkspaceAuditsPage } from "@/components/workspace-audits-view";
import { setSessionUser } from "@/lib/session";

const owner = { id: "workspace-a", name: "Platform team", createdAt: "2026-09-25T12:00:00Z", role: "owner" as const };
const audit = {
  id: "audit-a", workspaceId: "workspace-a", status: "completed", requestedBy: "creator-account-z", scope: { kind: "iac_text", format: "auto" },
  sourcePurged: false, specialists: ["devsecops", "sre"], partial: false, summary: "Review complete", createdAt: "2026-09-25T12:00:00Z", updatedAt: "2026-09-25T12:01:00Z",
  retention: { inputAvailable: true, inputPurgeStatus: "retained", inputExpiresAt: null, historyExpiresAt: null, inputPurgedAt: null },
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

function setup(fetcher: typeof fetch) {
  vi.stubEnv("NEXT_PUBLIC_WORKSPACE_AUDITS_ENABLED", "true");
  vi.stubGlobal("fetch", fetcher);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } });
  client.setQueryData(["user"], { id: "account-a", email: "a@example.test", displayName: "Account A", grokSubject: null });
  return {
    client,
    renderPage: () => render(<QueryClientProvider client={client}><WorkspaceAuditsPage workspaceId="workspace-a" /></QueryClientProvider>),
  };
}

function routeFetch(options: {
  role?: "owner" | "member" | "viewer";
  onCreate?: (body: Record<string, unknown>) => Response;
  onDelete?: () => Response;
  onPurge?: () => Response;
  workspaceIds?: string[];
  workspaceAuditsUnavailable?: boolean;
} = {}) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/api/workspaces")) return Response.json({ data: (options.workspaceIds ?? ["workspace-a"]).map((id) => ({ ...owner, id, role: options.role ?? "owner" })) });
    if (url.pathname === "/api/workspaces/workspace-a/audits" && init?.method === "POST") {
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      return options.onCreate?.(body) ?? Response.json({ ...audit, id: "audit-created", requestedBy: "account-a" }, { status: 202 });
    }
    if (/^\/api\/workspaces\/workspace-a\/audits\/[^/]+\/purge-source$/.test(url.pathname)) return options.onPurge?.() ?? Response.json({ ok: true, sourcePurged: false, inputPurgeStatus: "pending", cleanupReceiptId: "receipt-a", retention: { ...audit.retention, inputPurgeStatus: "pending" } }, { status: 202 });
    if (url.pathname === "/api/workspaces/workspace-a/audits/audit-a" && init?.method === "DELETE") return options.onDelete?.() ?? Response.json({ cleanupReceiptId: "receipt-delete-a", status: "pending" }, { status: 202 });
    if (/^\/api\/workspaces\/workspace-a\/audits\/[^/]+$/.test(url.pathname) && init?.method === "DELETE") return options.onDelete?.() ?? Response.json({ cleanupReceiptId: "receipt-delete-a", status: "pending" }, { status: 202 });
    if (/^\/api\/workspaces\/workspace-a\/audits\/[^/]+$/.test(url.pathname)) return Response.json({ ...audit, id: url.pathname.split("/").at(-1), findings: [{ id: "finding-a", severity: "high", title: "Review permissions", detail: "A broad role is attached.", resource: "module.web", remediation: "Narrow the role.", specialist: "devsecops" }], tasks: [], steps: [{ jobId: "audit-a", stepId: "step-a", agent: "sre", message: "Checked resilience.", ts: "2026-09-25T12:01:00Z" }] });
    if (url.pathname === "/api/workspaces/workspace-a/audits") return options.workspaceAuditsUnavailable ? Response.json({ error: "Not found" }, { status: 404 }) : Response.json({ data: [audit] });
    if (url.pathname === "/sanctum/csrf-cookie") return new Response(null, { status: 204 });
    throw new Error(`Unexpected request: ${url.pathname} ${init?.method ?? "GET"}`);
  }) as typeof fetch;
}

it("lets a workspace owner create, inspect, purge, and retry pending deletion through workspace routes", async () => {
  const fetcher = routeFetch({ onCreate: (body) => {
    expect(body).toEqual({ scope: { kind: "iac_text", format: "auto", content: "resource config" }, specialists: ["devsecops", "sre"] });
    return Response.json({ ...audit, id: "audit-created", requestedBy: "account-a" }, { status: 202 });
  } });
  const { renderPage, client } = setup(fetcher);
  renderPage();

  await userEvent.type(await screen.findByLabelText("Infrastructure configuration"), "resource config");
  await userEvent.click(screen.getByRole("button", { name: "Queue shared audit" }));
  expect(await screen.findByRole("heading", { name: "Audit details" })).toBeInTheDocument();
  expect(screen.getByText(/Review permissions/)).toBeInTheDocument();
  expect(screen.getByText(/Workspace Watchtower, exports, and scheduled audits are not available here/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Purge source" }));
  expect(await screen.findByText(/Purge status: pending/)).toBeInTheDocument();
  await userEvent.click(screen.getAllByRole("button", { name: "Close details" })[0]);
  await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
  expect(await screen.findByText(/Deletion pending for audit audit-a/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry deletion" })).toBeInTheDocument();
  expect(fetcher).toHaveBeenCalledWith(expect.stringMatching(/\/api\/workspaces\/workspace-a\/audits(?:\/audit-a)?$/), expect.anything());
  expect(client.getQueryData(["workspace-audits", "account-a", "workspace-a"])).toBeDefined();
});

it("lets members create shared audits but keeps owner cleanup controls hidden", async () => {
  const fetcher = routeFetch({ role: "member" });
  setup(fetcher).renderPage();

  expect(await screen.findByRole("button", { name: "Queue shared audit" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  expect(await screen.findByText("Review complete")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Details" }));
  expect(await screen.findByRole("heading", { name: "Audit details" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Purge source" })).not.toBeInTheDocument();
  expect(fetcher).not.toHaveBeenCalledWith(expect.stringContaining("/api/jobs"), expect.anything());
});

it("lets viewers read details and never offers write actions", async () => {
  const fetcher = routeFetch({ role: "viewer" });
  setup(fetcher).renderPage();

  expect(await screen.findByText("Review complete")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Queue shared audit" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Details" }));
  expect(await screen.findByText(/Review permissions/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Purge source" })).not.toBeInTheDocument();
});

it("does not request audits for a removed membership and keeps cache account/workspace scoped", async () => {
  const fetcher = routeFetch({ workspaceIds: ["another-workspace"] });
  const { client, renderPage } = setup(fetcher);
  client.setQueryData(["workspace-audits", "account-a", "workspace-a"], [audit]);
  renderPage();

  expect(await screen.findByRole("heading", { name: "Workspace unavailable" })).toBeInTheDocument();
  await waitFor(() => expect(fetcher).not.toHaveBeenCalledWith(expect.stringContaining("/api/workspaces/workspace-a/audits"), expect.anything()));
  await waitFor(() => expect(client.getQueryData(["workspace-audits", "account-a", "workspace-a"])).toBeUndefined());
  expect(client.getQueryData(["workspace-audits", "account-b", "workspace-a"])).toBeUndefined();
});

it("clears shared audit list, detail, and rollout cache on sign-out", async () => {
  const client = new QueryClient();
  client.setQueryData(["user"], { id: "account-a" });
  client.setQueryData(["workspace-audits", "account-a", "workspace-a"], [audit]);
  client.setQueryData(["workspace-audit-detail", "account-a", "workspace-a", "audit-a"], audit);
  client.setQueryData(["workspace-audits-unavailable", "account-a", "workspace-a"], true);

  await setSessionUser(client, null);

  expect(client.getQueryCache().getAll().map((query) => query.queryKey)).toEqual([["user"]]);
});

it("fails closed and clears cached audits when the server rollout endpoint is unavailable", async () => {
  const fetcher = routeFetch({ workspaceAuditsUnavailable: true });
  const { client, renderPage } = setup(fetcher);
  client.setQueryData(["workspace-audits", "account-a", "workspace-a"], [audit]);
  renderPage();

  expect(await screen.findByText(/Shared audits are unavailable/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Queue shared audit" })).not.toBeInTheDocument();
  await waitFor(() => expect(client.getQueryData(["workspace-audits", "account-a", "workspace-a"])).toBeUndefined());
});

it("makes no workspace-audit request when the rollout flag is off", async () => {
  vi.stubEnv("NEXT_PUBLIC_WORKSPACE_AUDITS_ENABLED", "false");
  const fetcher = vi.fn() as typeof fetch;
  vi.stubGlobal("fetch", fetcher);
  const client = new QueryClient();
  client.setQueryData(["user"], { id: "account-a" });
  render(<QueryClientProvider client={client}><WorkspaceAuditsPage workspaceId="workspace-a" /></QueryClientProvider>);

  expect(screen.getByText("Shared audits are not enabled for this deployment.")).toBeInTheDocument();
  expect(fetcher).not.toHaveBeenCalled();
});
