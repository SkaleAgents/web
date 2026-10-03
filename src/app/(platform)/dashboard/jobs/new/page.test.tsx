import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NewJobPage from "./page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/org/personal-cfgnns/jobs/new",
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("asks for a codebase review before a pasted infrastructure file", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({})));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><NewJobPage /></QueryClientProvider>);

  expect(screen.getByRole("heading", { name: "Review the codebase" })).toBeInTheDocument();
  expect(screen.getByText(/Pulumi program, or Docker Compose/)).toBeInTheDocument();
  expect(screen.getByText(/unlimited database pool, or a root container user/)).toBeInTheDocument();
  expect(screen.getByText(/public database, wildcard permissions, the Docker socket/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Set up MCP" })).toHaveAttribute("href", "/org/personal-cfgnns/mcp-config");
  expect(screen.getByRole("textbox", { name: "IaC content" })).toBeInTheDocument();
  expect(screen.getByText(/Paste your Terraform, CloudFormation, Kubernetes, or Pulumi YAML file, or a Dockerfile or GitHub Actions workflow/)).toBeInTheDocument();
  expect(screen.getByText(/a container that runs as root/)).toBeInTheDocument();
});
