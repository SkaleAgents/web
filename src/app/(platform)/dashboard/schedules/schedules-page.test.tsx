import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SchedulesPage from "./page";

vi.mock("next/navigation", () => ({ usePathname: () => "/org/personal-cfgnns/schedules" }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("lists schedules by name, cadence, and status, and sends add to its own page", async () => {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const path = new URL(String(input)).pathname;
    if (path === "/api/schedules") return Response.json({ schedules: [{
      id: "schedule-a", name: "Weekday review", cronExpression: "0 9 * * 1-5", timezone: "Asia/Dhaka", enabled: true, nextRunAt: "2026-10-02T03:00:00Z",
    }] });
    throw new Error(`Unexpected request: ${path}`);
  }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["user"], { id: "account-a", email: "a@example.test", displayName: "Account A" });
  render(<QueryClientProvider client={client}><SchedulesPage /></QueryClientProvider>);

  expect(await screen.findByRole("link", { name: "Weekday review" })).toHaveAttribute("href", "/org/personal-cfgnns/schedules/schedule-a");
  expect(screen.getByRole("link", { name: "Add schedule" })).toHaveAttribute("href", "/org/personal-cfgnns/schedules/new");
  expect(screen.getByRole("columnheader", { name: "Cadence" })).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "Weekdays" })).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "Active" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Create schedule" })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Retention policy" })).not.toBeInTheDocument();
});
