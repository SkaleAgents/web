import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NewJobPage from "./page";

const push = vi.hoisted(() => vi.fn());
const goTo = vi.hoisted(() => vi.fn());
vi.mock("@/lib/github", async (original) => ({ ...(await original<typeof import("@/lib/github")>()), goTo }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/org/personal-cfgnns/jobs/new",
  useRouter: () => ({ push }),
}));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); push.mockClear(); goTo.mockClear(); });

it("leads with the paste box and keeps the MCP route as a footer link", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({})));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><NewJobPage /></QueryClientProvider>);

  expect(screen.getByRole("textbox", { name: "IaC content" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Set up MCP" })).toHaveAttribute("href", "/mcp-config");
  expect(screen.getByRole("group", { name: "Review areas" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Review the codebase" })).not.toBeInTheDocument();
});

it("fills the paste box from Try a sample without submitting", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({})));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><NewJobPage /></QueryClientProvider>);
  expect(screen.getByLabelText("Audit text files")).toBeInTheDocument();
  expect(screen.queryByText("Database publicly accessible")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Try a sample" }));
  expect(screen.getByText(/This sample should report a database that is publicly accessible/)).toBeInTheDocument();
  expect(screen.getByText("Database publicly accessible")).toBeInTheDocument();
  expect(screen.getByText(/publicly_accessible = true becomes publicly_accessible = false/)).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "IaC content" })).toHaveValue([
    'resource "aws_db_instance" "app" {',
    "  publicly_accessible = true",
    "}",
    "",
  ].join("\n"));
  expect(push).not.toHaveBeenCalled();
});

it("fills the audit submission with both file markers after two files are chosen", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({})));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><NewJobPage /></QueryClientProvider>);
  const dockerfile = new File(["FROM nginx:latest\n"], "Dockerfile", { type: "text/plain" });
  const terraform = new File(["publicly_accessible = true\n"], "main.tf", { type: "text/plain" });
  await userEvent.upload(screen.getByLabelText("Audit text files"), [dockerfile, terraform]);

  await waitFor(() => {
    const submission = document.querySelector("textarea[aria-label='Audit submission content']");
    expect(submission).toBeInstanceOf(HTMLTextAreaElement);
    expect((submission as HTMLTextAreaElement).value).toBe([
      "----- skaleagents-file: Dockerfile -----",
      "FROM nginx:latest",
      "",
      "----- skaleagents-file: main.tf -----",
      "publicly_accessible = true",
      "",
    ].join("\n"));
  });
  expect(screen.getByText("2 files selected")).toBeInTheDocument();
  expect(screen.getByText("Dockerfile, main.tf")).toBeInTheDocument();
  expect(screen.queryByRole("textbox", { name: "IaC content" })).not.toBeInTheDocument();
});

it("shows the first-audit guide only when there are no audits yet", async () => {
  const stubJobs = (jobs: unknown[]) => vi.stubGlobal("fetch", vi.fn(async (url: string) =>
    String(url).includes("/api/jobs") ? Response.json({ jobs, nextCursor: null }) : Response.json({ id: "account-a", email: "a@example.test", displayName: "A" })));
  const renderPage = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(["user"], { id: "account-a", email: "a@example.test", displayName: "A" });
    render(<QueryClientProvider client={client}><NewJobPage /></QueryClientProvider>);
  };
  stubJobs([]);
  renderPage();
  expect(await screen.findByRole("heading", { name: "Run your first audit" })).toBeInTheDocument();
  cleanup();
  stubJobs([{ id: "job-1" }]);
  renderPage();
  await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled());
  expect(screen.queryByRole("heading", { name: "Run your first audit" })).not.toBeInTheDocument();
});

it("opens an upgrade prompt from Connect GitHub for a free plan", async () => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
  vi.stubGlobal("fetch", vi.fn(async (url: string) => String(url).includes("plan-usage")
    ? Response.json({ enforced: true, plan: "free", audits: { used: 0, limit: 2, remaining: 2, periodEnd: "2026-12-01T00:00:00Z" }, schedules: { active: 0, limit: 0, minimumIntervalHours: null } })
    : Response.json({ jobs: [], nextCursor: null })));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["user"], { id: "account-a", email: "a@example.test", displayName: "A" });
  render(<QueryClientProvider client={client}><NewJobPage /></QueryClientProvider>);
  await userEvent.click(screen.getByRole("button", { name: /Connect GitHub/ }));
  expect(await screen.findByRole("heading", { name: "Scan a GitHub repository", hidden: true })).toBeInTheDocument();
  expect(within(screen.getByRole("dialog")).getByRole("link", { name: "Upgrade" })).toHaveAttribute("href", "/org/personal-cfgnns/billing");
});

const paid = { enforced: true, plan: "pro", audits: { used: 0, limit: 50, remaining: 50, periodEnd: "2026-12-01T00:00:00Z" }, schedules: { active: 0, limit: 5, minimumIntervalHours: 1 } };
const repoPage = { repositories: [{ id: 7, fullName: "acme/infra", private: true, defaultBranch: "main" }], nextPage: 2 };

function renderPaid(installation: unknown, jobs?: (init: RequestInit) => Response) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  vi.stubGlobal("fetch", vi.fn(async (input: string, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.includes("plan-usage")) return Response.json(paid);
    if (url.endsWith("/api/github/installation")) return Response.json(installation);
    if (url.endsWith("/api/github/install-url")) return Response.json({ url: "https://github.com/apps/skale/installations/new?state=abc" });
    if (url.includes("/api/github/repositories/7/branches")) return Response.json({ branches: ["main", "dev"] });
    if (url.includes("/api/github/repositories?page=2")) return Response.json({ repositories: [{ id: 8, fullName: "acme/web", private: false, defaultBranch: "trunk" }], nextPage: null });
    if (url.includes("/api/github/repositories")) return Response.json(repoPage);
    if (url.includes("csrf-cookie")) return new Response(null, { status: 204 });
    if (url.endsWith("/api/jobs") && init.method === "POST") return jobs?.(init) ?? Response.json({ id: "job-9" }, { status: 202 });
    return Response.json({ jobs: [], nextCursor: null });
  }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["user"], { id: "account-a", email: "a@example.test", displayName: "A" });
  render(<QueryClientProvider client={client}><NewJobPage /></QueryClientProvider>);
  return calls;
}

it("starts the GitHub install for a paid plan that is not connected", async () => {
  const calls = renderPaid({ connected: false });
  const button = screen.getByRole("button", { name: /Connect GitHub/ });
  await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledWith(expect.stringContaining("/api/github/installation"), expect.anything()));
  await waitFor(() => expect(button).toBeEnabled());
  await userEvent.click(button);
  await waitFor(() => expect(goTo).toHaveBeenCalledWith("https://github.com/apps/skale/installations/new?state=abc"));
  expect(calls.some((call) => call.url.endsWith("/api/github/install-url"))).toBe(true);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("scans the chosen repository branch with a repo_ref and opens the audit", async () => {
  const calls = renderPaid({ connected: true, accountLogin: "acme", suspended: false });
  const open = await screen.findByRole("button", { name: /Scan a repository/ });
  await userEvent.click(open);
  const repo = await screen.findByRole("combobox", { name: "Repository" });
  await screen.findByRole("option", { name: "acme/infra (private)" });
  await userEvent.click(screen.getByRole("button", { name: "Load more" }));
  await screen.findByRole("option", { name: "acme/web" });
  await userEvent.selectOptions(repo, "7");
  await waitFor(() => expect(screen.getByRole("combobox", { name: "Branch" })).toHaveValue("main"));
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Branch" }), "dev");
  expect(screen.queryByRole("button", { name: "Start audit" })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Scan this branch" }));
  await waitFor(() => expect(push).toHaveBeenCalledWith("/org/personal-cfgnns/jobs/job-9"));
  const post = calls.find((call) => call.url.endsWith("/api/jobs") && call.init.method === "POST");
  expect(JSON.parse(String(post?.init.body))).toEqual({
    scope: { kind: "repo_ref", format: "auto", ref: "github:acme/infra@dev" },
    specialists: ["devsecops", "sre"],
  });
});

it("says GitHub suspended the installation", async () => {
  renderPaid({ connected: true, suspended: true });
  const open = await screen.findByRole("button", { name: /Scan a repository/ });
  await userEvent.click(open);
  expect(await screen.findByText("GitHub suspended the installation; resume it on GitHub.")).toBeInTheDocument();
  expect(screen.queryByRole("combobox", { name: "Repository" })).not.toBeInTheDocument();
});

it("shows the allowance message and Upgrade link on a 429", async () => {
  renderPaid({ connected: true }, () => Response.json({ error: "Audit limit reached", code: "audit_limit_reached" }, { status: 429 }));
  const open = await screen.findByRole("button", { name: /Scan a repository/ });
  await userEvent.click(open);
  await screen.findByRole("option", { name: "acme/infra (private)" });
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Repository" }), "7");
  await waitFor(() => expect(screen.getByRole("combobox", { name: "Branch" })).toHaveValue("main"));
  await userEvent.click(screen.getByRole("button", { name: "Scan this branch" }));
  const alert = await screen.findByText(/You've used all your audits this period/);
  expect(within(alert).getByRole("link", { name: "Upgrade" })).toHaveAttribute("href", "/org/personal-cfgnns/billing");
});
