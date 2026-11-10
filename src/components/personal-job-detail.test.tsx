import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersonalJobDetail } from "./personal-job-detail";
import { setSessionUser } from "@/lib/session";
import type { SwarmJob } from "@/lib/api";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard/jobs/00000000-0000-4000-8000-000000000001", useRouter: () => ({ push: vi.fn() }) }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("leads a scheduled run with the first fixes and the exact line", async () => {
  const jobId = "00000000-0000-4000-8000-000000000001";
  const job = {
    id: jobId,
    status: "completed",
    requestedBy: "owner",
    dispatchActor: "scheduler",
    scheduleId: "00000000-0000-4000-8000-000000000002",
    sourcePurged: false,
    specialists: ["devsecops"],
    partial: false,
    scope: { content: "publicly_accessible = true\n" },
    createdAt: "2026-09-28T12:00:00Z",
    updatedAt: "2026-09-28T12:00:00Z",
    findings: [
      { severity: "info", title: "Style note", detail: "Smaller note.", resource: "app", remediation: "Read the note.", specialist: "devsecops" },
      { severity: "low", title: "Minor note", detail: "Low note.", resource: "app", remediation: "Look later.", specialist: "devsecops" },
      { severity: "medium", title: "Timeout disabled", detail: "No timeout.", resource: "app", remediation: "Set a timeout.", specialist: "devsecops" },
      { severity: "high", title: "Database publicly accessible", detail: "The database accepts public connections.", resource: "db", remediation: "Disable public access.", specialist: "devsecops" },
    ],
  } satisfies SwarmJob;
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith(`/api/jobs/${jobId}`)) return Response.json(job);
    throw new Error(`Unexpected request: ${url}`);
  }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await setSessionUser(client, { id: "owner", displayName: "Owner", email: null, grokSubject: null });

  render(<QueryClientProvider client={client}><PersonalJobDetail id={jobId} /></QueryClientProvider>);

  expect(await screen.findByRole("region", { name: "Fix these first" })).toBeInTheDocument();
  expect(screen.getByText("publicly_accessible = true becomes publicly_accessible = false")).toBeInTheDocument();
  expect(document.querySelector("pre")?.textContent).toBe("publicly_accessible = true\npublicly_accessible = false");
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  await userEvent.click(screen.getByRole("button", { name: "Copy change" }));
  expect(writeText).toHaveBeenCalledWith("publicly_accessible = true becomes publicly_accessible = false");
  expect(screen.getByRole("button", { name: "Copy findings" })).toBeInTheDocument();
  const text = document.body.textContent ?? "";
  expect(text.indexOf("Fix these first")).toBeLessThan(text.indexOf("Style note"));
  expect(screen.getByRole("heading", { name: "Other findings" })).toBeInTheDocument();
  expect(screen.queryByText(/Audit retention policy/)).not.toBeInTheDocument();
});

it("does not render a before/after block when no exact rule matches", async () => {
  const jobId = "00000000-0000-4000-8000-000000000001";
  const job = {
    id: jobId,
    status: "completed",
    requestedBy: "owner",
    sourcePurged: false,
    specialists: ["devsecops"],
    partial: false,
    scope: { content: "actions = [\"*\"]\n" },
    createdAt: "2026-09-28T12:00:00Z",
    updatedAt: "2026-09-28T12:00:00Z",
    findings: [
      { severity: "high", title: "Wildcard IAM permissions", detail: "Broad actions.", resource: "role", remediation: "Replace the wildcard.", specialist: "devsecops" },
    ],
  } satisfies SwarmJob;
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith(`/api/jobs/${jobId}`)) return Response.json(job);
    throw new Error(`Unexpected request: ${url}`);
  }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await setSessionUser(client, { id: "owner", displayName: "Owner", email: null, grokSubject: null });

  render(<QueryClientProvider client={client}><PersonalJobDetail id={jobId} /></QueryClientProvider>);

  expect(await screen.findByText("No exact edit is available.")).toBeInTheDocument();
  expect(document.querySelector("pre")).toBeNull();
  expect(screen.queryByRole("button", { name: "Copy change" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Copy findings" })).toBeInTheDocument();
});

it("lists the files a GitHub scan read and why others were skipped", async () => {
  const jobId = "00000000-0000-4000-8000-000000000001";
  const job = {
    id: jobId, status: "completed", requestedBy: "owner", sourcePurged: false, specialists: ["devsecops"], partial: false,
    scope: { kind: "repo_ref", ref: "github:acme/infra@main" }, createdAt: "2026-11-04T12:00:00Z", updatedAt: "2026-11-04T12:00:00Z", findings: [],
    sourceFiles: [
      { path: "main.tf", status: "scanned" },
      { path: "k8s/app.yaml", status: "scanned" },
      { path: "big.tf", status: "skipped", reason: "too_large" },
      { path: "extra.tf", status: "skipped", reason: "over_file_limit" },
      { path: "more.tf", status: "skipped", reason: "over_total_limit" },
      { path: "notes.txt", status: "skipped", reason: "unsupported" },
      { path: "gone.tf", status: "skipped", reason: "fetch_failed" },
    ],
  } satisfies SwarmJob;
  vi.stubGlobal("fetch", vi.fn(async () => Response.json(job)));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await setSessionUser(client, { id: "owner", displayName: "Owner", email: null, grokSubject: null });
  render(<QueryClientProvider client={client}><PersonalJobDetail id={jobId} /></QueryClientProvider>);

  const section = await screen.findByRole("region", { name: "Files reviewed" });
  expect(section).toHaveTextContent("2 scanned, 5 skipped.");
  expect(section).toHaveTextContent("main.tf");
  expect(section).toHaveTextContent("big.tf: over 256 KiB");
  expect(section).toHaveTextContent("extra.tf: over the 50-file limit");
  expect(section).toHaveTextContent("more.tf: over the 2 MiB total");
  expect(section).toHaveTextContent("notes.txt: not a supported format");
  expect(section).toHaveTextContent("gone.tf: could not be read");
});

it.each([[true, 1], [false, 0]])("offers a fix pull request only for a branch audit (fixPullRequest %s)", async (fixPullRequest, buttons) => {
  const jobId = "00000000-0000-4000-8000-000000000001";
  const job = {
    id: jobId, status: "completed", requestedBy: "owner", sourcePurged: false, specialists: ["devsecops"], partial: false,
    scope: { kind: "repo_ref", ref: "github:acme/infra@main" }, createdAt: "2026-11-04T12:00:00Z", updatedAt: "2026-11-04T12:00:00Z",
    sourceFiles: [{ path: "main.tf", status: "scanned" }], fixPullRequest,
    findings: [{ severity: "high", title: "Database publicly accessible", detail: "Detail.", resource: "main.tf:resource.aws_db_instance.main.publicly_accessible", remediation: "Fix.", specialist: "devsecops", fingerprint: "b".repeat(64), change: "new", decision: null }],
  } as SwarmJob;
  vi.stubGlobal("fetch", vi.fn(async () => Response.json(job)));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await setSessionUser(client, { id: "owner", displayName: "Owner", email: null, grokSubject: null });
  render(<QueryClientProvider client={client}><PersonalJobDetail id={jobId} /></QueryClientProvider>);

  await screen.findByRole("region", { name: "Files reviewed" });
  expect(screen.queryAllByRole("button", { name: "Open a fix pull request" })).toHaveLength(buttons);
});

it("shows what changed, and dismisses and restores a finding", async () => {
  const jobId = "00000000-0000-4000-8000-000000000001";
  const previousId = "00000000-0000-4000-8000-000000000009";
  const fingerprint = "a".repeat(64);
  let decision: { kind: "false_positive"; reason: string } | null = null;
  const job = () => ({
    id: jobId, status: "completed", requestedBy: "owner", dispatchActor: "user", sourcePurged: false, specialists: ["devsecops"], partial: false,
    scope: { content: "x" }, createdAt: "2026-09-28T12:00:00Z", updatedAt: "2026-09-28T12:00:00Z",
    comparison: { previousJobId: previousId, new: 1, stillOpen: 0, fixed: [{ title: "Old problem", severity: "high", resource: "db" }] },
    findings: [{ severity: "high", title: "Noisy bucket", detail: "Detail.", resource: "bucket", remediation: "Fix.", specialist: "devsecops", fingerprint, change: "new", decision }],
  }) as SwarmJob;
  const requests: Array<{ method: string; body: unknown }> = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/sanctum/csrf-cookie")) return new Response(null, { status: 204 });
    if (url.endsWith(`/api/jobs/${jobId}/findings/${fingerprint}/decision`)) {
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      requests.push({ method: String(init?.method), body });
      decision = body ? { kind: body.decision, reason: body.reason } : null;
      return Response.json({ decision });
    }
    if (url.endsWith(`/api/jobs/${jobId}`)) return Response.json(job());
    throw new Error(`Unexpected request: ${url}`);
  }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await setSessionUser(client, { id: "owner", displayName: "Owner", email: null, grokSubject: null });

  render(<QueryClientProvider client={client}><PersonalJobDetail id={jobId} /></QueryClientProvider>);

  const changes = await screen.findByRole("region", { name: "Since the last audit" });
  expect(changes).toHaveTextContent("1 new, 0 still open, 1 fixed");
  expect(changes).toHaveTextContent("Fixed: Old problem");
  expect(screen.getByText("New")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  await userEvent.type(screen.getByLabelText("Reason"), "Internal only");
  await userEvent.click(screen.getByRole("button", { name: "Save decision" }));

  const dismissed = await screen.findByRole("region", { name: "Dismissed findings" });
  expect(requests[0]).toEqual({ method: "PUT", body: { decision: "false_positive", reason: "Internal only" } });
  expect(dismissed).toHaveTextContent("False positive: Internal only");
  expect(screen.queryByRole("region", { name: "Fix these first" })).not.toBeInTheDocument();

  await userEvent.click(within(dismissed).getByRole("button", { name: "Restore" }));
  await waitFor(() => expect(screen.queryByRole("region", { name: "Dismissed findings" })).not.toBeInTheDocument());
  expect(requests[1]).toEqual({ method: "DELETE", body: null });
  expect(await screen.findByRole("region", { name: "Fix these first" })).toBeInTheDocument();
});

it("saves the source context and shows why a finding moved", async () => {
  const jobId = "00000000-0000-4000-8000-000000000001";
  let context: { production: boolean | null; internetFacing: boolean | null; sensitiveData: boolean | null } | null = null;
  const sent: unknown[] = [];
  const job = () => ({
    id: jobId, status: "completed", requestedBy: "owner", dispatchActor: "user", sourcePurged: false, specialists: ["devsecops"], partial: false,
    scope: { content: "x" }, createdAt: "2026-09-28T12:00:00Z", updatedAt: "2026-09-28T12:00:00Z", sourceContext: context,
    findings: [
      { severity: "high", title: "Timeout disabled", detail: "D.", resource: "a", remediation: "F.", specialist: "sre", priority: context ? 3 : undefined, priorityReasons: context ? ["Ranked lower: not production"] : undefined },
      { severity: "medium", title: "Public network", detail: "D.", resource: "b", remediation: "F.", specialist: "sre", priority: context ? 4 : undefined, priorityReasons: context ? ["Ranked higher: internet-facing"] : undefined },
    ],
  }) as SwarmJob;
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/sanctum/csrf-cookie")) return new Response(null, { status: 204 });
    if (url.endsWith(`/api/jobs/${jobId}/source-context`)) {
      context = JSON.parse(String(init?.body));
      sent.push(context);
      return Response.json({ sourceContext: context });
    }
    if (url.endsWith(`/api/jobs/${jobId}`)) return Response.json(job());
    throw new Error(`Unexpected request: ${url}`);
  }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await setSessionUser(client, { id: "owner", displayName: "Owner", email: null, grokSubject: null });

  render(<QueryClientProvider client={client}><PersonalJobDetail id={jobId} /></QueryClientProvider>);

  const form = await screen.findByRole("form", { name: "About this source" });
  await userEvent.selectOptions(within(form).getByLabelText("Reachable from the internet?"), "true");
  await userEvent.click(within(form).getByRole("button", { name: "Save" }));

  expect(await screen.findByText("Ranked higher: internet-facing")).toBeInTheDocument();
  expect(sent).toEqual([{ production: null, internetFacing: true, sensitiveData: null }]);
  const text = screen.getByRole("region", { name: "Fix these first" }).textContent ?? "";
  expect(text.indexOf("Public network")).toBeLessThan(text.indexOf("Timeout disabled"));
});

it("offers no source context on a pasted audit", async () => {
  const jobId = "00000000-0000-4000-8000-000000000001";
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({
    id: jobId, status: "completed", requestedBy: "owner", dispatchActor: "user", sourcePurged: false, specialists: ["devsecops"], partial: false,
    scope: { content: "x" }, createdAt: "2026-09-28T12:00:00Z", updatedAt: "2026-09-28T12:00:00Z", findings: [],
  })));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await setSessionUser(client, { id: "owner", displayName: "Owner", email: null, grokSubject: null });

  render(<QueryClientProvider client={client}><PersonalJobDetail id={jobId} /></QueryClientProvider>);

  expect(await screen.findByText("No findings were recorded.")).toBeInTheDocument();
  expect(screen.queryByRole("form", { name: "About this source" })).not.toBeInTheDocument();
});
