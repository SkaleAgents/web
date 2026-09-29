import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleSignInButton } from "./google-sign-in-button";

const { push, toastError } = vi.hoisted(() => ({ push: vi.fn(), toastError: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: toastError } }));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function renderMockSignIn() {
  vi.stubEnv("NEXT_PUBLIC_MOCK_AUTH_ENABLED", "true");
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><GoogleSignInButton /></QueryClientProvider>);
  return client;
}

it("keeps local preview sign-in working from the header and populates the shared account", async () => {
  const user = { id: "local-user", displayName: "Rayhan" };
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(Response.json({ user }));
  vi.stubGlobal("fetch", fetcher);
  const client = renderMockSignIn();
  client.setQueryData(["swarm-jobs", "previous-user"], [{ summary: "Private previous audit" }]);
  client.setQueryData(["bot", "private-bot", "previous-user"], { promptBody: "Private previous prompt" });

  await userEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));

  await waitFor(() => expect(push).toHaveBeenCalledWith("/me"));
  expect(client.getQueryData(["user"])).toEqual(user);
  expect(client.getQueryData(["swarm-jobs", "previous-user"])).toBeUndefined();
  expect(client.getQueryData(["bot", "private-bot", "previous-user"])).toBeUndefined();
  expect(fetcher.mock.calls[0][0]).toMatch(/\/sanctum\/csrf-cookie$/);
  expect(fetcher.mock.calls[1][0]).toMatch(/\/api\/auth\/google\/callback$/);
  expect(fetcher.mock.calls[1][1]).toMatchObject({ method: "POST", credentials: "include" });
});

it("lets a failed local sign-in retry without caching a user or navigating", async () => {
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(Response.json({ error: "Sign-in unavailable" }, { status: 503 })));
  const client = renderMockSignIn();

  await userEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));

  await waitFor(() => expect(toastError).toHaveBeenCalledWith("Sign-in unavailable"));
  expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
  expect(client.getQueryData(["user"])).toBeUndefined();
  expect(push).not.toHaveBeenCalled();
});
