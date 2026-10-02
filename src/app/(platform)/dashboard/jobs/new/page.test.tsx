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
  expect(screen.getByText(/scan the Terraform, CloudFormation, or Kubernetes files/)).toBeInTheDocument();
  expect(screen.getByText(/Pulumi is not scanned yet/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Set up MCP" })).toHaveAttribute("href", "/org/personal-cfgnns/mcp-config");
  expect(screen.getByRole("textbox", { name: "IaC content" })).toBeInTheDocument();
  expect(screen.getByText(/Paste your Terraform, CloudFormation, or Kubernetes file/)).toBeInTheDocument();
});
