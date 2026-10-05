import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NewSchedulePage from "./page";

const push = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => "/org/personal-a/schedules/new", useRouter: () => ({ push }) }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); push.mockReset(); });

it("creates a public GitHub file schedule without caller-supplied source metadata", async () => {
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(String(input)).pathname;
    if (path === "/sanctum/csrf-cookie") return new Response(null, { status: 204 });
    if (path === "/api/schedules" && init?.method === "POST") return Response.json({ id: "schedule-a" }, { status: 201 });
    if (path === "/api/schedules") return Response.json({ schedules: [] });
    throw new Error(`Unexpected request: ${path}`);
  });
  vi.stubGlobal("fetch", fetcher);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["user"], { id: "account-a", email: "a@example.test", displayName: "Account A" });
  render(<QueryClientProvider client={client}><NewSchedulePage /></QueryClientProvider>);

  fireEvent.click(screen.getByRole("button", { name: "Public GitHub file" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Public repository" }), { target: { value: "acme/infra" } });
  fireEvent.change(screen.getByRole("textbox", { name: "File path" }), { target: { value: "k8s/deployment.yaml" } });
  fireEvent.click(screen.getByRole("button", { name: "Create schedule" }));

  await waitFor(() => expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("/api/schedules"), expect.objectContaining({ method: "POST" })));
  const request = fetcher.mock.calls.find(([, init]) => init?.method === "POST");
  expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({
    scope: { kind: "repo_ref", format: "auto", ref: "github:acme/infra:k8s/deployment.yaml@main" },
  });
  expect(JSON.parse(String(request?.[1]?.body))).not.toHaveProperty("sourceRevision");
  await waitFor(() => expect(push).toHaveBeenCalledWith("/org/personal-a/schedules/schedule-a"));
});

it("submits both file markers when two text files are chosen", async () => {
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(String(input)).pathname;
    if (path === "/sanctum/csrf-cookie") return new Response(null, { status: 204 });
    if (path === "/api/schedules" && init?.method === "POST") return Response.json({ id: "schedule-b" }, { status: 201 });
    if (path === "/api/schedules") return Response.json({ schedules: [] });
    throw new Error(`Unexpected request: ${path}`);
  });
  vi.stubGlobal("fetch", fetcher);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["user"], { id: "account-a", email: "a@example.test", displayName: "Account A" });
  render(<QueryClientProvider client={client}><NewSchedulePage /></QueryClientProvider>);

  expect(screen.getByText("Several text files can be added and each file is scanned on its own.")).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Scheduled IaC content" })).toBeInTheDocument();
  const dockerfile = new File(["FROM nginx:latest\n"], "nested/Dockerfile", { type: "text/plain" });
  const terraform = new File(["publicly_accessible = true\n"], "main.tf", { type: "text/plain" });
  await userEvent.upload(screen.getByLabelText("Schedule text files"), [dockerfile, terraform]);
  await waitFor(() => expect(screen.getByRole("button", { name: "Create schedule" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Create schedule" }));

  await waitFor(() => expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("/api/schedules"), expect.objectContaining({ method: "POST" })));
  const request = fetcher.mock.calls.find(([, init]) => init?.method === "POST");
  const body = JSON.parse(String(request?.[1]?.body)) as { scope: { format: string; content: string } };
  expect(body.scope.format).toBe("auto");
  expect(body.scope.content).toContain("----- skaleagents-file: Dockerfile -----");
  expect(body.scope.content).toContain("----- skaleagents-file: main.tf -----");
  expect(body.scope.content).not.toContain("nested/");
});
