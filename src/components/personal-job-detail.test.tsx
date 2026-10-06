import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
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
