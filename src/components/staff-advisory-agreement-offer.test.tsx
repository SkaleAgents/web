import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StaffAdvisoryBooking } from "@/lib/api";

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  ensureCsrfCookie: vi.fn(),
  useStaffUserId: vi.fn(() => "staff-user"),
}));

vi.mock("@/lib/api", async (load) => ({ ...await load<typeof import("@/lib/api")>(), apiFetch: mocks.apiFetch, ensureCsrfCookie: mocks.ensureCsrfCookie }));
vi.mock("@/components/staff-access", () => ({ useStaffUserId: mocks.useStaffUserId }));

const booking: StaffAdvisoryBooking = {
  id: "booking-a",
  version: 8,
  source: { type: "audit_job", id: "job-a" },
  status: "accepted",
  scope: "Original request scope",
  urgency: "soon",
  preferredWindow: { startAt: "2026-09-28T16:00:00Z", endAt: "2026-09-28T17:00:00Z" },
  notes: null,
  assigneeRef: "expert:42",
  billing: { billableMinutes: null, feeCents: null, currency: "USD" },
  agreement: null,
  appointment: null,
  history: [],
  createdAt: "2026-09-25T15:00:00Z",
  updatedAt: "2026-09-25T16:00:00Z",
};

describe("staff advisory agreement offer", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ADVISORY_AGREEMENTS_ENABLED", "true");
    mocks.apiFetch.mockReset();
    mocks.ensureCsrfCookie.mockReset();
  });

  it("offers exact USD contract values with the booking If-Match token", async () => {
    mocks.apiFetch.mockResolvedValue({ ...booking, version: 9, agreement: { version: 1 } });
    const { StaffAdvisoryAgreementOffer } = await import("@/components/staff-advisory-agreement-offer");
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    render(<QueryClientProvider client={client}><StaffAdvisoryAgreementOffer booking={booking} onRefresh={vi.fn()} /></QueryClientProvider>);
    fireEvent.change(screen.getByLabelText("Exact scope"), { target: { value: "Review rollback procedure" } });
    fireEvent.change(screen.getByLabelText("Written estimate (USD)"), { target: { value: "312.50" } });
    fireEvent.click(screen.getByRole("button", { name: "Offer new version" }));

    await waitFor(() => expect(mocks.apiFetch).toHaveBeenCalledTimes(1));
    expect(mocks.apiFetch).toHaveBeenCalledWith("/api/staff/advisory-bookings/booking-a/agreement", expect.objectContaining({
      method: "PATCH",
      headers: { "If-Match": "8" },
      body: JSON.stringify({
        scope: "Review rollback procedure",
        quotedFeeCents: 31250,
        currency: "USD",
        minimumBillableMinutes: 60,
        incrementMinutes: 15,
        rateCentsPerHour: 25000,
        cancellationTermsVersion: "paid-pilot-v1",
      }),
    }));
    expect(screen.getByText(/Customer acceptance is still required/)).toBeTruthy();
    expect(screen.queryByText(/payment successful|payment received|charged/i)).toBeNull();
  });

  it("prevents duplicate submits while the offer request is pending", async () => {
    let resolveRequest!: (value: StaffAdvisoryBooking) => void;
    mocks.apiFetch.mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
    const { StaffAdvisoryAgreementOffer } = await import("@/components/staff-advisory-agreement-offer");
    const client = new QueryClient();
    render(<QueryClientProvider client={client}><StaffAdvisoryAgreementOffer booking={booking} onRefresh={vi.fn()} /></QueryClientProvider>);
    fireEvent.change(screen.getByLabelText("Written estimate (USD)"), { target: { value: "125.00" } });
    const submit = screen.getByRole("button", { name: "Offer new version" });
    fireEvent.click(submit);
    fireEvent.click(submit);
    await waitFor(() => expect(mocks.apiFetch).toHaveBeenCalledTimes(1));
    expect(submit).toBeDisabled();
    resolveRequest({ ...booking, version: 9 });
  });
});
