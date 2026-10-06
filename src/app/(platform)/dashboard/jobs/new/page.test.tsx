import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NewJobPage from "./page";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  usePathname: () => "/org/personal-cfgnns/jobs/new",
  useRouter: () => ({ push }),
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
  expect(screen.getByText("Several text files can be added and each file is scanned on its own, while the paste box remains for a single snippet.")).toBeInTheDocument();
  expect(screen.getByText(/a container that runs as root/)).toBeInTheDocument();
});

it("fills the paste box from Try a sample without submitting", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({})));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><NewJobPage /></QueryClientProvider>);
  expect(screen.getByLabelText("Audit text files")).toBeInTheDocument();
  expect(screen.getByText("This sample should report a database that is publicly accessible.")).toBeInTheDocument();
  expect(screen.getByText("Database publicly accessible")).toBeInTheDocument();
  expect(screen.getByText("publicly_accessible = true becomes publicly_accessible = false")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Try a sample" }));
  expect(screen.getByRole("textbox", { name: "IaC content" })).toHaveValue([
    'resource "aws_db_instance" "app" {',
    "  publicly_accessible = true",
    "}",
    "",
  ].join("\n"));
  expect(push).not.toHaveBeenCalled();
});

it("fills the audit submission with both file markers after two files are chosen", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({})));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><NewJobPage /></QueryClientProvider>);
  const dockerfile = new File(["FROM nginx:latest\n"], "Dockerfile", { type: "text/plain" });
  const terraform = new File(["publicly_accessible = true\n"], "main.tf", { type: "text/plain" });
  await userEvent.upload(screen.getByLabelText("Audit text files"), [dockerfile, terraform]);

  await waitFor(() => {
    const submission = document.querySelector("textarea[aria-label='Audit submission content']");
    expect(submission).toBeInstanceOf(HTMLTextAreaElement);
    expect((submission as HTMLTextAreaElement).value).toBe([
      "----- skaleagents-file: Dockerfile -----",
      "FROM nginx:latest",
      "",
      "----- skaleagents-file: main.tf -----",
      "publicly_accessible = true",
      "",
    ].join("\n"));
  });
  expect(screen.getByRole("textbox", { name: "IaC content" })).toHaveValue("");
});
