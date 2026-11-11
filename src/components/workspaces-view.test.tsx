import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { WorkspacesView } from "@/components/workspaces-view";
import { apiFetch } from "@/lib/api";

vi.mock("@/lib/api", async (load) => ({ ...(await load<typeof import("@/lib/api")>()), apiFetch: vi.fn(), ensureCsrfCookie: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("lists a newly created organization at once, even when the create response lacks its kind", async () => {
  const personal = { id: "0198f0b0-0000-7000-8000-000000000001", name: "Personal", kind: "personal", role: "owner" };
  const team = { id: "0198f0b0-0000-7000-8000-000000000002", name: "QA check", kind: "team", role: "owner", createdAt: "2026-11-11T00:00:00Z" };
  let created = false;
  vi.mocked(apiFetch).mockImplementation(async (path, init) => {
    if (path === "/api/workspaces" && init?.method === "POST") { created = true; return { data: { id: "0198f0b0-0000-7000-8000-000000000002", name: "QA check", role: "owner" } } as never; }
    if (path === "/api/workspaces") return { data: created ? [personal, team] : [personal] } as never;
    throw new Error(`Unexpected request: ${path}`);
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(["user"], { id: "u1", email: "u@example.test", displayName: "U" });
  render(<QueryClientProvider client={client}><WorkspacesView /></QueryClientProvider>);

  expect(await screen.findByText("You do not belong to an organization yet.")).toBeVisible();
  await userEvent.type(screen.getByLabelText("Organization name"), "QA check");
  await userEvent.click(screen.getByRole("button", { name: "Create organization" }));
  expect(await screen.findByRole("link", { name: "QA check" })).toBeVisible();
  expect(screen.queryByText("You do not belong to an organization yet.")).toBeNull();
});
