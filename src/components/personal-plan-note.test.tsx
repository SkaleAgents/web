import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersonalPlanNote } from "./personal-plan-note";

vi.mock("next/navigation", () => ({ usePathname: () => "/org/personal-cfgnns/jobs/new" }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function renderNote(audits: { used: number; limit: number; remaining: number }, schedules = { active: 0, limit: 0, minimumIntervalHours: null as number | null }) {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ enforced: true, plan: "free", audits: { ...audits, periodEnd: "2026-12-01T00:00:00Z" }, schedules })));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["user"], { id: "account-a", email: "a@example.test", displayName: "Account A" });
  render(<QueryClientProvider client={client}><PersonalPlanNote kind="audits" /><PersonalPlanNote kind="schedules" /></QueryClientProvider>);
}

it("shows how many audits are left", async () => {
  renderNote({ used: 1, limit: 2, remaining: 1 }, { active: 1, limit: 10, minimumIntervalHours: 24 });
  expect(await screen.findByText("1 of 2 audits left")).toBeInTheDocument();
  expect(screen.getByRole("progressbar", { name: "Audits used this period" })).toHaveAttribute("aria-valuenow", "1");
  expect(screen.queryByRole("link", { name: "Upgrade" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Usage details" }));
  expect(screen.getByText(/1 of 2 audits used this period. Resets/)).toBeInTheDocument();
  expect(screen.getByText("Free plan")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Upgrade" })).toHaveAttribute("href", "/org/personal-cfgnns/billing");
  fireEvent.keyDown(screen.getByRole("button", { name: "Usage details" }), { key: "Escape" });
  expect(screen.queryByRole("link", { name: "Upgrade" })).toBeNull();
  expect(screen.getByText("1 of 10 active schedules. Each runs at most every 24 hours.")).toBeInTheDocument();
});

it("points to an upgrade once the audits are used up", async () => {
  renderNote({ used: 2, limit: 2, remaining: 0 });
  expect(await screen.findByRole("alert")).toHaveTextContent("You've used all 2 audits this period.");
  expect(screen.getAllByRole("link", { name: "Upgrade your plan" })[0]).toHaveAttribute("href", "/org/personal-cfgnns/billing");
});
