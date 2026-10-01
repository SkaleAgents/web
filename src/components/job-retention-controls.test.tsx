import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { JobRetentionControls } from "./job-retention-controls";
import type { SwarmJob } from "@/lib/api";

const job = {
  id: "00000000-0000-4000-8000-000000000001",
  status: "completed",
  requestedBy: "owner",
  sourcePurged: false,
  specialists: ["devsecops"],
  partial: false,
  scope: {},
  createdAt: "2026-09-26T11:09:46Z",
  updatedAt: "2026-09-26T11:09:49Z",
} satisfies SwarmJob;

const report = {
  generatedAt: "2026-09-26T11:09:53Z",
  job: { id: "00000000-0000-4000-8000-000000000001", status: "completed" },
  controls: [{ theme: "access", findingCount: 1, findings: [{ title: "Public network access detected", severity: "high" }] }],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderControls() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["user"], { id: "owner" });
  render(<QueryClientProvider client={client}><JobRetentionControls job={job} accountId="owner" onDeletion={() => {}} /></QueryClientProvider>);
}

it("opens a file-type menu and downloads only after a format is chosen", async () => {
  const user = userEvent.setup();
  const fetcher = vi.fn(async () => Response.json(report));
  vi.stubGlobal("fetch", fetcher);
  const downloads: string[] = [];
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:report");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function click(this: HTMLAnchorElement) {
    downloads.push(this.download);
  });
  renderControls();

  await user.click(screen.getByRole("button", { name: "Download report" }));

  expect(screen.getByRole("menu", { name: "Report file type" })).toBeInTheDocument();
  expect(screen.getByRole("menuitem", { name: "JSON" })).toBeInTheDocument();
  expect(screen.getByRole("menuitem", { name: "PDF" })).toBeInTheDocument();
  expect(screen.getByRole("menuitem", { name: "CSV" })).toBeInTheDocument();
  expect(fetcher).not.toHaveBeenCalled();
  expect(downloads).toEqual([]);

  await user.click(screen.getByRole("menuitem", { name: "CSV" }));

  await waitFor(() => expect(downloads).toEqual(["audit-00000000-0000-4000-8000-000000000001.csv"]));
  expect(fetcher).toHaveBeenCalledOnce();
  expect(screen.queryByRole("menu", { name: "Report file type" })).not.toBeInTheDocument();
});
