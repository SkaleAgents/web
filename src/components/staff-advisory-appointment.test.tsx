import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, type StaffAdvisoryBooking } from "@/lib/api";

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
  preferredWindow: { startAt: "2026-09-28T16:00:00Z", endAt: "2026-09-28T18:00:00Z" },
  notes: null,
  assigneeRef: "expert:42",
  billing: { billableMinutes: null, feeCents: null, currency: "USD" },
  agreement: null,
  appointment: null,
  delivery: null,
  history: [],
  createdAt: "2026-09-25T15:00:00Z",
  updatedAt: "2026-09-25T16:00:00Z",
};

function renderAppointment(current = booking) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const refresh = vi.fn().mockResolvedValue({ isSuccess: true });
  return import("@/components/staff-advisory-appointment").then(({ StaffAdvisoryAppointment }) => {
    const result = render(<QueryClientProvider client={client}><StaffAdvisoryAppointment booking={current} onRefresh={refresh} /></QueryClientProvider>);
    return {
      ...result,
      refresh,
      rerenderBooking: (updated: StaffAdvisoryBooking) => result.rerender(<QueryClientProvider client={client}><StaffAdvisoryAppointment booking={updated} onRefresh={refresh} /></QueryClientProvider>),
    };
  });
}

describe("staff appointment confirmation", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ADVISORY_AGREEMENTS_ENABLED", "true");
    mocks.apiFetch.mockReset();
    mocks.ensureCsrfCookie.mockReset();
  });

  it("keeps requested and confirmed windows distinct and sends the explicit timezone with If-Match", async () => {
    mocks.apiFetch.mockResolvedValue({ ...booking, version: 9, appointment: { confirmedWindow: { startAt: "2026-09-29T16:00:00Z", endAt: "2026-09-29T17:00:00Z", timezone: "America/Los_Angeles" }, confirmedAt: "2026-09-25T18:00:00Z" } });
    await renderAppointment();
    expect(screen.getByText(/Customer preferred window \(not confirmed\)/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Timezone (IANA)"), { target: { value: "America/Los_Angeles" } });
    fireEvent.change(screen.getByLabelText("Confirmed start in selected timezone"), { target: { value: "2026-09-29T09:00" } });
    fireEvent.change(screen.getByLabelText("Confirmed end in selected timezone"), { target: { value: "2026-09-29T10:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm appointment" }));

    await waitFor(() => expect(mocks.apiFetch).toHaveBeenCalledTimes(1));
    expect(mocks.apiFetch).toHaveBeenCalledWith("/api/staff/advisory-bookings/booking-a/appointment", expect.objectContaining({
      method: "PATCH",
      headers: { "If-Match": "8" },
      body: JSON.stringify({ confirmedWindow: { startAt: "2026-09-29T09:00:00-07:00", endAt: "2026-09-29T10:00:00-07:00", timezone: "America/Los_Angeles" } }),
    }));
  });

  it("rejects invalid timezones without making an API request", async () => {
    await renderAppointment();
    fireEvent.change(screen.getByLabelText("Timezone (IANA)"), { target: { value: "Not/A_Zone" } });
    fireEvent.change(screen.getByLabelText("Confirmed start in selected timezone"), { target: { value: "2026-09-29T09:00" } });
    fireEvent.change(screen.getByLabelText("Confirmed end in selected timezone"), { target: { value: "2026-09-29T10:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm appointment" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("valid IANA timezone");
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it("requires an explicit review of refreshed booking after a stale-version response", async () => {
    mocks.apiFetch.mockRejectedValue(new ApiError("Booking changed", 409));
    const view = await renderAppointment();
    fireEvent.change(screen.getByLabelText("Timezone (IANA)"), { target: { value: "UTC" } });
    fireEvent.change(screen.getByLabelText("Confirmed start in selected timezone"), { target: { value: "2026-09-29T16:00" } });
    fireEvent.change(screen.getByLabelText("Confirmed end in selected timezone"), { target: { value: "2026-09-29T17:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm appointment" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("booking changed");
    expect(screen.getByRole("button", { name: "Review refreshed booking" })).toBeDisabled();
    view.rerenderBooking({ ...booking, version: 9 });
    const review = screen.getByRole("button", { name: "Review refreshed booking" });
    expect(review).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Refresh booking" }));
    await waitFor(() => expect(review).toBeEnabled());
    fireEvent.click(review);
    expect(screen.queryByText(/Review the refreshed booking/)).toBeNull();
    fireEvent.change(screen.getByLabelText("Confirmed start in selected timezone"), { target: { value: "2026-09-29T16:00" } });
    fireEvent.change(screen.getByLabelText("Confirmed end in selected timezone"), { target: { value: "2026-09-29T17:00" } });
    expect(screen.getByRole("button", { name: "Confirm appointment" })).toBeEnabled();
  });

  it("does not render or send appointment requests while the advisory flag is off", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADVISORY_AGREEMENTS_ENABLED", "false");
    await renderAppointment();
    expect(screen.queryByRole("region", { name: "Confirm appointment" })).toBeNull();
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });
});
