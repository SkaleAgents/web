import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CustomerBookingAccess } from "@/components/customer-booking-access";
import { CustomerBookingDetail, CustomerBookingList } from "@/components/customer-bookings";
import { setSessionUser } from "@/lib/session";

vi.mock("next/navigation", () => ({ usePathname: () => "/org/00000000-0000-4000-8000-000000000002/advisory-bookings" }));

const fixtureBooking = {
  id: "booking-customer-a",
  version: 1,
  source: { type: "watchtower_session" as const, id: "session-source-1" },
  status: "completed" as const,
  assigneeRef: "expert:internal-7",
  scope: "Review the deployment plan",
  urgency: "soon" as const,
  preferredWindow: { startAt: "2026-09-28T16:00:00Z", endAt: "2026-09-28T17:00:00Z" },
  notes: "Focus on rollback.",
  billing: { billableMinutes: 60, feeCents: 25000, currency: "USD" },
  agreement: null,
  appointment: null,
  createdAt: "2026-09-25T12:00:00Z",
  updatedAt: "2026-09-25T12:00:00Z",
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

function setup(fetcher: typeof fetch) {
  vi.stubGlobal("fetch", fetcher);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } });
  return { client, render: (child: React.ReactNode) => render(<QueryClientProvider client={client}><CustomerBookingAccess>{child}</CustomerBookingAccess></QueryClientProvider>) };
}

function accountResponse() {
  return Response.json({ id: "customer-a", displayName: "Customer A", email: "a@example.test", grokSubject: null });
}

it("loads only the signed-in caller's list into an account-scoped cache", async () => {
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/api/user")) return accountResponse();
    if (url.endsWith("/api/advisory-bookings")) return Response.json({ bookings: [fixtureBooking] });
    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;
  const { client, render: renderPage } = setup(fetcher);

  renderPage(<CustomerBookingList />);

  expect(await screen.findByText("Review the deployment plan")).toBeInTheDocument();
  expect(screen.getByText(/Preferred window \(requested, not confirmed\)/)).toBeInTheDocument();
  expect(fetcher).toHaveBeenCalledWith(expect.stringMatching(/\/api\/advisory-bookings$/), expect.objectContaining({ credentials: "include" }));
  expect(client.getQueryData(["customer-advisory-bookings", "customer-a"])).toEqual([fixtureBooking]);
  expect(client.getQueryData(["customer-advisory-bookings", "customer-b"])).toBeUndefined();
});

it("shows the portfolio mirror separately and does not infer payment from confirmation", async () => {
  vi.stubEnv("NEXT_PUBLIC_PORTFOLIO_BOOKING_HANDOFF_ENABLED", "true");
  const linked = {
    id: "linked-1",
    source: null,
    expiresAt: "2026-10-06T00:00:00Z",
    bookingPublicId: "01abc",
    bookingStatus: "confirmed",
    packageSlug: "pro",
    amountDueCents: 24900,
    currency: "USD",
    startsAt: "2026-10-02T10:00:00Z",
    endsAt: "2026-10-02T11:00:00Z",
    paymentStatus: "unpaid",
    lastSyncedAt: "2026-09-28T00:00:00Z",
    createdAt: "2026-09-27T00:00:00Z",
  };
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/api/user")) return accountResponse();
    if (url.endsWith("/api/advisory-bookings")) return Response.json({ bookings: [] });
    if (url.endsWith("/api/portfolio-booking-referrals")) return Response.json({ referrals: [linked] });
    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;
  const { client, render: renderPage } = setup(fetcher);

  renderPage(<CustomerBookingList />);

  expect(await screen.findByRole("heading", { name: "Consultations with Harun" })).toBeInTheDocument();
  expect(await screen.findByText("No payment confirmed")).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText(/Status may be delayed/)).toBeInTheDocument());
  expect(client.getQueryData(["customer-portfolio-booking-referrals", "customer-a"])).toEqual([linked]);
  expect(client.getQueryData(["customer-portfolio-booking-referrals", "customer-b"])).toBeUndefined();
});

it("keeps customer detail language inside the deployed fields' limits", async () => {
  vi.stubEnv("NEXT_PUBLIC_ADVISORY_AGREEMENTS_ENABLED", "true");
  const withAppointment = {
    ...fixtureBooking,
    version: 4,
    agreement: null,
    appointment: {
      confirmedWindow: { startAt: "2026-09-29T16:00:00Z", endAt: "2026-09-29T17:00:00Z", timezone: "America/Los_Angeles" },
      confirmedAt: "2026-09-25T18:00:00Z",
    },
  };
  const fetcher = vi.fn(async (input: RequestInfo | URL) => String(input).endsWith("/api/user")
    ? accountResponse()
    : Response.json(withAppointment)) as typeof fetch;
  const { client, render: renderPage } = setup(fetcher);

  renderPage(<CustomerBookingDetail id={fixtureBooking.id} />);

  expect(await screen.findByRole("heading", { name: /Advisory request/ })).toBeInTheDocument();
  expect(screen.getByText(/requested, not confirmed/)).toBeInTheDocument();
  expect(screen.getByText("Confirmed window (America/Los_Angeles)")).toBeInTheDocument();
  expect(screen.getByText(/separate from your requested preferred window/)).toBeInTheDocument();
  expect(screen.getByText("expert:internal-7")).toBeInTheDocument();
  expect(screen.getByText(/internal reference, not a contact detail/)).toBeInTheDocument();
  expect(screen.getByText("250.00 USD")).toBeInTheDocument();
  expect(screen.getByText(/not a payment confirmation/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Open source Watchtower session" })).toHaveAttribute("href", "/org/00000000-0000-4000-8000-000000000002/watchtower/session-source-1");
  expect(fetcher).toHaveBeenCalledWith(expect.stringMatching(/\/api\/advisory-bookings\/booking-customer-a$/), expect.objectContaining({ credentials: "include" }));
  expect(client.getQueryData(["customer-advisory-booking", "customer-a", fixtureBooking.id])).toEqual(withAppointment);
});

it("presents an unavailable response generically for guessed or removed booking IDs", async () => {
  const fetcher = vi.fn(async (input: RequestInfo | URL) => String(input).endsWith("/api/user")
    ? accountResponse()
    : Response.json({ message: "Not found" }, { status: 404 })) as typeof fetch;
  const { render: renderPage } = setup(fetcher);

  renderPage(<CustomerBookingDetail id="another-customer-booking" />);

  expect(await screen.findByRole("heading", { name: "Request unavailable" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("This request is unavailable or has been removed.");
  expect(screen.queryByText("another-customer-booking")).not.toBeInTheDocument();
});

it("clears account-scoped booking data and asks for sign-in after session expiry", async () => {
  let userRequests = 0;
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/api/user")) {
      userRequests += 1;
      return userRequests === 1 ? accountResponse() : Response.json({ message: "Unauthenticated" }, { status: 401 });
    }
    if (url.endsWith("/api/advisory-bookings")) return Response.json({ message: "Unauthenticated" }, { status: 401 });
    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;
  const { client, render: renderPage } = setup(fetcher);
  client.setQueryData(["customer-advisory-bookings", "customer-a"], [fixtureBooking]);

  renderPage(<CustomerBookingList />);

  expect(await screen.findByRole("heading", { name: "Sign in to view advisory requests" })).toBeInTheDocument();
  await waitFor(() => expect(client.getQueryData(["customer-advisory-bookings", "customer-a"])).toBeUndefined());
  expect(client.getQueryData(["user"])).toBeNull();
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
});

it("clears all prior-account cache on sign-out", async () => {
  const client = new QueryClient();
  client.setQueryData(["customer-advisory-bookings", "customer-a"], [fixtureBooking]);
  client.setQueryData(["customer-advisory-booking", "customer-a", fixtureBooking.id], fixtureBooking);
  client.setQueryData(["customer-portfolio-booking-referrals", "customer-a"], []);
  client.setQueryData(["user"], { id: "customer-a" });

  await setSessionUser(client, null);

  expect(client.getQueryCache().getAll().map((query) => query.queryKey)).toEqual([["user"]]);
});
