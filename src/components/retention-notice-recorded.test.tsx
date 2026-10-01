import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import JobsPage from "@/app/(platform)/dashboard/jobs/page";
import SchedulesPage from "@/app/(platform)/dashboard/schedules/page";
import { RetentionNotice } from "@/components/retention-notice";
import { setSessionUser } from "@/lib/session";

vi.mock("next/navigation", () => ({
  usePathname: () => "/org/personal-cfgnns/schedules",
  useRouter: () => ({ push: vi.fn() }),
}));

const recordedPolicy = {
  accountId: "owner",
  enabled: false,
  acknowledgementEnabled: true,
  version: "audit-minimal-v1",
  notice: ["Audit input becomes eligible for cleanup 15 minutes after completion or failure."],
  noticeDeliveredAt: "2026-10-01T04:30:00Z",
  legacyNotBefore: "2026-10-31T04:30:00Z",
  noticeArchived: true,
  noticeToken: "token-1",
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mockAccount(path: "jobs" | "schedules") {
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/api/jobs")) return Response.json({ jobs: [] });
    if (url.endsWith("/api/schedules")) return Response.json({ schedules: [] });
    if (url.endsWith("/api/account/retention")) return Response.json(recordedPolicy);
    throw new Error(`Unexpected request: ${url} for ${path}`);
  }) as typeof fetch;
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}

async function renderPage(page: "jobs" | "schedules") {
  const fetcher = mockAccount(page);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await setSessionUser(client, { id: "owner", displayName: "Owner", email: null, grokSubject: null });
  const Page = page === "jobs" ? JobsPage : SchedulesPage;
  render(<QueryClientProvider client={client}><Page /></QueryClientProvider>);
  return fetcher;
}

async function expectRecordedNoticeHidden(heading: string, fetcher: typeof fetch) {
  expect(await screen.findByRole("heading", { name: heading })).toBeInTheDocument();
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("/api/account/retention"), expect.anything()));
  await waitFor(() => expect(screen.queryByText(/Notice recorded/)).not.toBeInTheDocument());
  expect(screen.queryByRole("region", { name: "Retention policy" })).not.toBeInTheDocument();
}

it("hides the recorded retention notice on organization schedules", async () => {
  const fetcher = await renderPage("schedules");
  await expectRecordedNoticeHidden("Scheduled audits", fetcher);
});

it("hides the recorded retention notice on audit jobs", async () => {
  const fetcher = await renderPage("jobs");
  await expectRecordedNoticeHidden("Audit jobs", fetcher);
});

it("keeps the recorded retention notice on the account record", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json(recordedPolicy)) as typeof fetch);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><RetentionNotice accountId="owner" /></QueryClientProvider>);
  expect(await screen.findByText(/Notice recorded/)).toBeInTheDocument();
});

it("still asks for acceptance on schedules when the notice is not recorded", async () => {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/api/schedules")) return Response.json({ schedules: [] });
    if (url.endsWith("/api/account/retention")) return Response.json({ ...recordedPolicy, noticeArchived: false, noticeDeliveredAt: null, legacyNotBefore: null });
    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await setSessionUser(client, { id: "owner", displayName: "Owner", email: null, grokSubject: null });
  render(<QueryClientProvider client={client}><SchedulesPage /></QueryClientProvider>);
  expect(await screen.findByRole("button", { name: "I've read this retention policy" })).toBeInTheDocument();
});
