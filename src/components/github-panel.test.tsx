import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GithubPanel } from "./github-panel";
import { setSessionUser } from "@/lib/session";

vi.mock("next/navigation", () => ({ usePathname: () => "/org/acme/jobs/new" }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("turns automatic pull request reviews on", async () => {
  let enabled = false;
  const sent: unknown[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/sanctum/csrf-cookie")) return new Response(null, { status: 204 });
    if (url.endsWith("/api/github/installation/pull-reviews")) {
      sent.push(JSON.parse(String(init?.body)));
      enabled = true;
      return Response.json({ connected: true, pullRequestReviews: true });
    }
    if (url.endsWith("/api/github/installation")) return Response.json({ connected: true, accountLogin: "octocat", suspended: false, pullRequestReviews: enabled });
    if (url.includes("/api/github/repositories")) return Response.json({ repositories: [], nextPage: null });
    throw new Error(`Unexpected request: ${url}`);
  }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await setSessionUser(client, { id: "owner", displayName: "Owner", email: null, grokSubject: null });

  render(<QueryClientProvider client={client}><GithubPanel onRef={() => undefined} onClose={() => undefined} /></QueryClientProvider>);

  const toggle = await screen.findByRole("checkbox", { name: /Review pull requests automatically/ });
  expect(toggle).not.toBeChecked();
  await userEvent.click(toggle);
  await waitFor(() => expect(toggle).toBeChecked());
  expect(sent).toEqual([{ enabled: true }]);
});
