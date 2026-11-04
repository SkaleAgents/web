import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GithubCallbackPage from "./page";

const replace = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); replace.mockClear(); window.history.replaceState(null, "", "/"); });

function renderCallback(search: string, post: () => Response) {
  window.history.replaceState(null, "", `/github/callback${search}`);
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  vi.stubGlobal("fetch", vi.fn(async (input: string, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.includes("csrf-cookie")) return new Response(null, { status: 204 });
    if (url.endsWith("/api/github/installation")) return post();
    return Response.json({});
  }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["user"], { id: "account-a", email: "a@example.test", displayName: "A" });
  render(<QueryClientProvider client={client}><GithubCallbackPage /></QueryClientProvider>);
  return calls;
}

it("posts the three install parameters once, clears them from the address, and returns to New audit", async () => {
  const calls = renderCallback("?installation_id=42&setup_action=install&state=signed&code=oauth", () => Response.json({ connected: true }));
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/me/jobs/new"));
  const posts = calls.filter((call) => call.url.endsWith("/api/github/installation"));
  expect(posts).toHaveLength(1);
  expect(posts[0].init?.method).toBe("POST");
  expect(JSON.parse(String(posts[0].init?.body))).toEqual({ installationId: 42, state: "signed", code: "oauth" });
  expect(window.location.search).toBe("");
});

it("explains an expired link and offers Try again", async () => {
  renderCallback("?installation_id=42&state=old&code=oauth", () => Response.json({ message: "invalid", errors: {} }, { status: 422 }));
  expect(await screen.findByText(/This GitHub link expired/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/me/jobs/new");
  expect(replace).not.toHaveBeenCalled();
});

it("says so when GitHub is unavailable and when the link is incomplete", async () => {
  renderCallback("?installation_id=42&state=s&code=c", () => Response.json({ error: "down", code: "github_unavailable" }, { status: 503 }));
  expect(await screen.findByText("GitHub is unavailable right now. Try again in a minute.")).toBeInTheDocument();
  cleanup();
  const calls = renderCallback("?state=s", () => Response.json({}));
  expect(await screen.findByText(/This link is incomplete/)).toBeInTheDocument();
  expect(calls.some((call) => call.url.endsWith("/api/github/installation"))).toBe(false);
});
