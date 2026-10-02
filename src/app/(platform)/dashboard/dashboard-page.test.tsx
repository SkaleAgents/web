import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DashboardPage from "./page";
import type { RetentionPolicy } from "@/lib/api";
import { setSessionUser } from "@/lib/session";

vi.mock("next/navigation", () => ({ usePathname: () => "/org/personal-cfgnns" }));

const noticeLine = "Audit input becomes eligible for cleanup 15 minutes after completion or failure.";

const pendingPolicy: RetentionPolicy = {
  accountId: "owner",
  enabled: false,
  acknowledgementEnabled: true,
  version: "audit-minimal-v1",
  notice: [noticeLine],
  noticeDeliveredAt: null,
  legacyNotBefore: null,
  noticeArchived: false,
  noticeToken: "token-1",
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
  document.cookie = "skale_retention_later=; Max-Age=0; Path=/";
  document.cookie = "skale_cookie_consent=; Max-Age=0; Path=/";
  document.cookie = "skale_site_consent=; Max-Age=0; Path=/";
});

function installDialog() {
  if (typeof HTMLDialogElement === "undefined") return;
  if (typeof HTMLDialogElement.prototype.showModal === "function") return;
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
}

function mockDashboard(policy: RetentionPolicy) {
  installDialog();
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/api/jobs")) return Response.json({ jobs: [] });
    if (url.endsWith("/api/schedules")) return Response.json({ schedules: [] });
    if (url.endsWith("/api/bots")) return Response.json({ bots: [] });
    if (url.endsWith("/api/account/retention") && (!init?.method || init.method === "GET")) return Response.json(policy);
    if (url.endsWith("/sanctum/csrf-cookie")) return new Response(null, { status: 204 });
    if (url.endsWith("/api/account/retention/acknowledge") && init?.method === "POST") {
      return Response.json({
        ...policy,
        noticeArchived: true,
        noticeDeliveredAt: "2026-10-01T04:30:00Z",
        legacyNotBefore: "2026-10-31T04:30:00Z",
      });
    }
    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}

async function renderDashboard(policy = pendingPolicy) {
  const fetcher = mockDashboard(policy);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await setSessionUser(client, { id: "owner", displayName: "Harun R Rayhan", email: "owner@example.com", grokSubject: null });
  render(<QueryClientProvider client={client}><DashboardPage /></QueryClientProvider>);
  return fetcher;
}

it("opens the retention policy on the personal dashboard until the account accepts it", async () => {
  await renderDashboard();

  const dialog = await screen.findByRole("dialog", { name: "Audit retention policy" });
  expect(dialog).toHaveTextContent(noticeLine);
  expect(screen.getByRole("button", { name: "I've read this retention policy" })).toBeInTheDocument();

  const cancel = new Event("cancel", { cancelable: true });
  dialog.dispatchEvent(cancel);
  expect(cancel.defaultPrevented).toBe(true);
  expect(screen.getByRole("dialog", { name: "Audit retention policy" })).toBeInTheDocument();
});

it("leaves the dashboard clear after the notice is already recorded", async () => {
  await renderDashboard({
    ...pendingPolicy,
    noticeArchived: true,
    noticeDeliveredAt: "2026-09-25T00:00:00Z",
    legacyNotBefore: "2026-10-25T00:00:00Z",
  });

  expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("hides the popup without a reminder cookie until optional cookies are allowed", async () => {
  const fetcher = await renderDashboard();

  fireEvent.click(await screen.findByRole("button", { name: "Do it later" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(document.cookie).not.toContain("skale_retention_later=");
  expect(fetcher).not.toHaveBeenCalledWith(
    expect.stringContaining("/api/account/retention/acknowledge"),
    expect.anything(),
  );
});

it("stores the 24 hour reminder after optional cookies are allowed", async () => {
  document.cookie = "skale_site_consent=accepted; Path=/";
  await renderDashboard();

  fireEvent.click(await screen.findByRole("button", { name: "Do it later" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(document.cookie).toContain("skale_retention_later=");

  cleanup();
  sessionStorage.clear();
  await renderDashboard();
  expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("shows the popup again after the 24 hour reminder expires", async () => {
  document.cookie = `skale_retention_later=${encodeURIComponent(JSON.stringify({ owner: Date.now() - 1000 }))}; Path=/`;
  await renderDashboard();
  expect(await screen.findByRole("dialog", { name: "Audit retention policy" })).toBeInTheDocument();
});

it("records acceptance from the dashboard dialog", async () => {
  const fetcher = await renderDashboard();

  fireEvent.click(await screen.findByRole("button", { name: "I've read this retention policy" }));

  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(fetcher).toHaveBeenCalledWith(
    expect.stringContaining("/api/account/retention/acknowledge"),
    expect.objectContaining({ method: "POST" }),
  );
});
