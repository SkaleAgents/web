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
  vi.stubEnv("NEXT_PUBLIC_WORKSPACE_AUDIT_CREATION_ENABLED", "true");
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
  emptyResult?: { status: string; partial?: boolean; error?: string };
  onCreate?: (body: Record<string, unknown>) => Response;
  onDelete?: () => Response;
  onPurge?: () => Response;
  workspaceIds?: string[];
  workspaceAuditsUnavailable?: boolean;
  workspaceAuditsWrongTenant?: boolean;
} = {}) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/api/workspaces")) return Response.json({ data: (options.workspaceIds ?? ["workspace-a"]).map((id) => ({ ...owner, id, role: options.role ?? "owner" })) });
    if (url.pathname === "/api/workspaces/workspace-a/jobs" && init?.method === "POST") {
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      return options.onCreate?.(body) ?? Response.json({ ...audit, id: "audit-created", requestedBy: "account-a" }, { status: 202 });
    }
    if (/^\/api\/workspaces\/workspace-a\/jobs\/[^/]+\/purge-source$/.test(url.pathname)) return options.onPurge?.() ?? Response.json({ ok: true, sourcePurged: false, inputPurgeStatus: "pending", cleanupReceiptId: "receipt-a", retention: { ...audit.retention, inputPurgeStatus: "pending" } }, { status: 202 });
    if (url.pathname === "/api/workspaces/workspace-a/jobs/audit-a" && init?.method === "DELETE") return options.onDelete?.() ?? Response.json({ cleanupReceiptId: "receipt-delete-a", status: "pending" }, { status: 202 });
    if (/^\/api\/workspaces\/workspace-a\/jobs\/[^/]+$/.test(url.pathname) && init?.method === "DELETE") return options.onDelete?.() ?? Response.json({ cleanupReceiptId: "receipt-delete-a", status: "pending" }, { status: 202 });
    if (/^\/api\/workspaces\/workspace-a\/jobs\/[^/]+$/.test(url.pathname)) return Response.json({ ...audit, id: url.pathname.split("/").at(-1), ...(options.emptyResult ?? {}), findings: options.emptyResult ? [] : [{ id: "finding-a", severity: "high", title: "Review permissions", detail: "A broad role is attached.", resource: "module.web", remediation: "Narrow the role.", specialist: "devsecops" }], tasks: [], steps: [{ jobId: "audit-a", stepId: "step-a", agent: "sre", message: "Checked resilience.", ts: "2026-09-25T12:01:00Z" }] });
    if (url.pathname === "/api/workspaces/workspace-a/jobs") return options.workspaceAuditsUnavailable ? Response.json({ error: "Not found" }, { status: 404 }) : Response.json({ jobs: options.workspaceAuditsWrongTenant ? [audit, { ...audit, id: "audit-b", workspaceId: "workspace-b" }] : [audit] });
    if (url.pathname === "/sanctum/csrf-cookie") return new Response(null, { status: 204 });
    throw new Error(`Unexpected request: ${url.pathname} ${init?.method ?? "GET"}`);
  }) as typeof fetch;
}

it("lets a workspace owner inspect, purge, and retry pending deletion through workspace routes", async () => {
  const fetcher = routeFetch();
  const { renderPage, client } = setup(fetcher);
  renderPage();

  expect(await screen.findByRole("link", { name: "New shared audit" })).toHaveAttribute("href", "/org/workspace-a/jobs/new");
  await userEvent.click(await screen.findByRole("button", { name: "Details" }));
  expect(await screen.findByRole("heading", { name: "Audit details" })).toBeInTheDocument();
  expect(screen.getByText(/Review permissions/)).toBeInTheDocument();
  expect(screen.getByText(/Watchtower and exports are not available for shared jobs yet/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Purge source" }));
  expect(fetcher).not.toHaveBeenCalledWith(expect.stringMatching(/purge-source$/), expect.anything());
  await userEvent.click(screen.getByRole("button", { name: "Confirm source purge" }));
  expect(await screen.findByText(/Purge status: pending/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Close details" }));
  await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
  expect(fetcher).not.toHaveBeenCalledWith(expect.stringMatching(/\/audit-a$/), expect.objectContaining({ method: "DELETE" }));
  await userEvent.click(screen.getByRole("button", { name: "Confirm audit deletion" }));
  expect(await screen.findByText(/Audit deletion pending for audit-a/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Retry deletion" })).not.toBeInTheDocument();
  expect(fetcher).toHaveBeenCalledWith(expect.stringMatching(/\/api\/workspaces\/workspace-a\/jobs(?:\/audit-a)?$/), expect.anything());
  expect(client.getQueryData(["workspace-audits", "account-a", "workspace-a"])).toBeDefined();
});

it("lets members create shared audits but keeps owner cleanup controls hidden", async () => {
  const fetcher = routeFetch({ role: "member" });
  setup(fetcher).renderPage();

  expect(await screen.findByRole("link", { name: "New shared audit" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  expect(await screen.findByText("Review complete")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Details" }));
  expect(await screen.findByRole("heading", { name: "Audit details" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Purge source" })).not.toBeInTheDocument();
  expect(fetcher).not.toHaveBeenCalledWith(expect.stringMatching(/\/api\/jobs(?:\/|$)/), expect.anything());
});

it("lets viewers read details and never offers write actions", async () => {
  const fetcher = routeFetch({ role: "viewer" });
  setup(fetcher).renderPage();

  expect(await screen.findByText("Review complete")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "New shared audit" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Details" }));
  expect(await screen.findByText(/Review permissions/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Purge source" })).not.toBeInTheDocument();
});

it("does not request audits for a removed membership and keeps cache account/workspace scoped", async () => {
  const fetcher = routeFetch({ workspaceIds: ["workspace-b"] });
  const { client, renderPage } = setup(fetcher);
  client.setQueryData(["workspace-audits", "account-a", "workspace-a"], [audit]);
  client.setQueryData(["workspace-audit-detail", "account-a", "workspace-a", "audit-a"], audit);
  client.setQueryData(["workspace-audits", "account-a", "workspace-b"], [{ ...audit, id: "audit-b", workspaceId: "workspace-b" }]);
  renderPage();

  expect(await screen.findByRole("heading", { name: "Organization unavailable" })).toBeInTheDocument();
  await waitFor(() => expect(fetcher).not.toHaveBeenCalledWith(expect.stringContaining("/api/workspaces/workspace-a/jobs"), expect.anything()));
  await waitFor(() => expect(client.getQueryData(["workspace-audits", "account-a", "workspace-a"])).toBeUndefined());
  expect(client.getQueryData(["workspace-audit-detail", "account-a", "workspace-a", "audit-a"])).toBeUndefined();
  expect(client.getQueryData(["workspace-audits", "account-a", "workspace-b"])).toEqual([{ ...audit, id: "audit-b", workspaceId: "workspace-b" }]);
  expect(client.getQueryData(["workspace-audits", "account-b", "workspace-a"])).toBeUndefined();
});

it("clears shared audit list, detail, and rollout cache on sign-out", async () => {
  const client = new QueryClient();
  client.setQueryData(["user"], { id: "account-a" });
  client.setQueryData(["workspace-audits", "account-a", "workspace-a"], [audit]);
  client.setQueryData(["workspace-audit-detail", "account-a", "workspace-a", "audit-a"], audit);
  client.setQueryData(["workspace-audit-deletion-status", "account-a", "workspace-a", "audit-a"], { status: "pending" });
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
  expect(screen.queryByRole("link", { name: "New shared audit" })).not.toBeInTheDocument();
  await waitFor(() => expect(client.getQueryData(["workspace-audits", "account-a", "workspace-a"])).toBeUndefined());
});

it("hides all shared audits and actions when a list contains another organization's job", async () => {
  const fetcher = routeFetch({ workspaceAuditsWrongTenant: true });
  const { client, renderPage } = setup(fetcher);
  renderPage();

  expect(await screen.findByText(/Shared audits are unavailable/)).toBeInTheDocument();
  expect(screen.queryByText("Review complete")).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "New shared audit" })).not.toBeInTheDocument();
  expect(client.getQueryData(["workspace-audits", "account-a", "workspace-a"])).toBeUndefined();
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


it.each([
  ["queued", false, "No findings are available yet."],
  ["running", false, "No findings are available yet."],
  ["completed", false, "No findings were reported."],
  ["completed", true, "No findings were reported. Coverage was partial; some checks did not complete."],
  ["failed", false, "The audit failed without reporting findings. Review the error and audit activity."],
  ["failed", false, "The audit was cancelled without reporting findings.", "Cancelled by user"],
])("explains an empty %s audit result (partial: %s)", async (status, partial, message, error?: string) => {
  setup(routeFetch({ emptyResult: { status, partial, error } })).renderPage();
  await userEvent.click(await screen.findByRole("button", { name: "Details" }));
  expect(await screen.findByText(message, { exact: true })).toBeInTheDocument();
  if (status !== "queued" && status !== "running") {
    expect(screen.queryByText("No findings are available yet.")).not.toBeInTheDocument();
  }
});
