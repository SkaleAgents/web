import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OpenFixPullRequest } from "./fix-pull-request";
import type { SwarmFinding } from "@/lib/api";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const finding = (title: string) => ({ severity: "high", title, detail: "d", resource: "r", remediation: "x", fingerprint: "a".repeat(64) }) as SwarmFinding;
const renderButton = (title: string) => render(<QueryClientProvider client={new QueryClient()}><OpenFixPullRequest jobId="job-1" finding={finding(title)} /></QueryClientProvider>);

it("opens the pull request and links to it", async () => {
  const calls: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/sanctum/csrf-cookie")) return new Response(null, { status: 204 });
    calls.push(`${init?.method} ${new URL(url, "http://x").pathname}`);
    return Response.json({ pullRequestUrl: "https://github.com/octocat/infra/pull/7" }, { status: 201 });
  }));
  renderButton("Database publicly accessible");

  await userEvent.click(screen.getByRole("button", { name: "Open a fix pull request" }));

  expect(await screen.findByRole("link", { name: "Review the pull request" })).toHaveAttribute("href", "https://github.com/octocat/infra/pull/7");
  expect(calls).toEqual([`POST /api/jobs/job-1/findings/${"a".repeat(64)}/fix-pull-request`]);
});

it("explains a 404 and offers nothing for findings without an exact edit", async () => {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => String(input).endsWith("/sanctum/csrf-cookie") ? new Response(null, { status: 204 }) : Response.json({ error: "Not found" }, { status: 404 })));
  renderButton("Database publicly accessible");
  await userEvent.click(screen.getByRole("button", { name: "Open a fix pull request" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("only available for audits of a branch");

  cleanup();
  renderButton("Wildcard IAM action detected");
  expect(screen.queryByRole("button")).toBeNull();
});
