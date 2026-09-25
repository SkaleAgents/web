import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdvisoryBooking } from "@/lib/api";

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  ensureCsrfCookie: vi.fn(),
  useCustomerUser: vi.fn(() => ({ id: "owner-a" })),
}));

vi.mock("@/lib/api", async (load) => ({ ...await load<typeof import("@/lib/api")>(), apiFetch: mocks.apiFetch, ensureCsrfCookie: mocks.ensureCsrfCookie }));
vi.mock("@/components/customer-booking-access", () => ({ useCustomerUser: mocks.useCustomerUser }));

const booking = (version = 3): AdvisoryBooking => ({
  id: "booking-a",
  version,
  assigneeRef: null,
  source: { type: "audit_job", id: "job-a" },
  status: "accepted",
  scope: "Initial request",
  urgency: "soon",
  preferredWindow: { startAt: "2026-09-28T16:00:00Z", endAt: "2026-09-28T17:00:00Z" },
  notes: null,
  billing: { billableMinutes: null, feeCents: null, currency: "USD" },
  agreement: {
    id: "agreement-a",
    version: 2,
    scope: "Review the rollback plan",
    currency: "USD",
    quotedFeeCents: 31250,
    minimumBillableMinutes: 60,
    incrementMinutes: 15,
    rateCentsPerHour: 25000,
    cancellationTermsVersion: "paid-pilot-v1",
    offeredAt: "2026-09-25T16:00:00Z",
    acceptedAt: null,
  },
  createdAt: "2026-09-25T15:00:00Z",
  updatedAt: "2026-09-25T16:00:00Z",
});

async function setup(props: { value?: AdvisoryBooking; onRefresh?: () => void } = {}) {
  vi.stubEnv("NEXT_PUBLIC_ADVISORY_AGREEMENTS_ENABLED", "true");
  const { AdvisoryAgreementReview } = await import("@/components/advisory-agreement-review");
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const view = render(<QueryClientProvider client={client}><AdvisoryAgreementReview booking={props.value ?? booking()} onRefresh={props.onRefresh ?? vi.fn()} /></QueryClientProvider>);
  return { ...view, client };
}

describe("customer agreement review", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mocks.apiFetch.mockReset();
    mocks.ensureCsrfCookie.mockReset();
  });

  it("shows the complete quote and explicitly accepts the current exact version with If-Match", async () => {
    const agreed = { ...booking(), version: 4, agreement: { ...booking().agreement!, acceptedAt: "2026-09-25T16:10:00Z" } };
    mocks.apiFetch.mockResolvedValue(agreed);
    await setup();

    expect(screen.getByText("$312.50 USD")).toBeTruthy();
    expect(screen.getByText("$250.00 per hour")).toBeTruthy();
    expect(screen.getByText(/60 billable minutes/)).toBeTruthy();
    expect(screen.getByText(/15-minute increments/)).toBeTruthy();
    expect(screen.getByText(/at least 24 hours/)).toBeTruthy();
    expect(screen.queryByText(/payment (?:was )?confirmed|payment succeeded/i)).toBeNull();
    fireEvent.click(screen.getByRole("checkbox"));
    const submit = screen.getByRole("button", { name: "Accept version 2" });
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => expect(mocks.apiFetch).toHaveBeenCalledTimes(1));
    expect(mocks.apiFetch).toHaveBeenCalledWith("/api/advisory-bookings/booking-a/agreement/accept", expect.objectContaining({
      method: "POST",
      headers: { "If-Match": "3" },
      body: JSON.stringify({ agreementVersion: 2 }),
    }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("accepted"));
  });

  it("rejects stale acceptance, refreshes booking, and requires a new explicit review action", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADVISORY_AGREEMENTS_ENABLED", "true");
    const { ApiError } = await import("@/lib/api");
    mocks.apiFetch.mockRejectedValue(new ApiError("Advisory agreement version is no longer current", 409));
    const { rerender, client } = await setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Accept version 2" }));
    await waitFor(() => expect(screen.getByText(/This offer changed before your acceptance was saved/)).toBeTruthy());
    expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["customer-advisory-booking", "owner-a", "booking-a"] }));
    expect(mocks.apiFetch).toHaveBeenCalledTimes(1);

    const { AdvisoryAgreementReview } = await import("@/components/advisory-agreement-review");
    const fresh = booking(4);
    fresh.agreement!.version = 3;
    rerender(<QueryClientProvider client={client}><AdvisoryAgreementReview booking={fresh} onRefresh={vi.fn()} /></QueryClientProvider>);
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
    expect(screen.getByRole("button", { name: "Accept version 3" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(mocks.apiFetch).toHaveBeenCalledTimes(1);
  });

  it("keeps agreement controls hidden and sends no agreement request when the flag is off", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADVISORY_AGREEMENTS_ENABLED", "false");
    const { AdvisoryAgreementReview } = await import("@/components/advisory-agreement-review");
    const client = new QueryClient();
    const { container } = render(<QueryClientProvider client={client}><AdvisoryAgreementReview booking={booking()} onRefresh={vi.fn()} /></QueryClientProvider>);
    expect(container.textContent).toBe("");
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });
});
