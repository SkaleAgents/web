import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StaffAdvisoryBooking } from "@/lib/api";
import { StaffAdvisoryDelivery } from "@/components/staff-advisory-delivery";

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
  status: "scheduled",
  scope: "Review rollback plan",
  urgency: "soon",
  preferredWindow: { startAt: "2026-09-28T16:00:00Z", endAt: "2026-09-28T17:00:00Z" },
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

function renderEditor(current = booking, onRefresh = vi.fn().mockResolvedValue({ isSuccess: true })) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return { ...render(<QueryClientProvider client={client}><StaffAdvisoryDelivery booking={current} onRefresh={onRefresh} /></QueryClientProvider>), onRefresh };
}

describe("staff advisory delivery handoff", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ADVISORY_AGREEMENTS_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_ADVISORY_DELIVERY_HANDOFFS_ENABLED", "true");
    mocks.apiFetch.mockReset();
    mocks.ensureCsrfCookie.mockReset();
  });

  it("saves changed details as pending and requires a separate confirmation", async () => {
    const saved = { ...booking, version: 9, delivery: { ownerRef: "delivery-owner:1", contact: { name: "Test Owner", channel: "email", value: "owner@example.test" }, handoffStatus: "pending" as const, handedOffAt: null } };
    const ready = { ...saved, version: 10, delivery: { ...saved.delivery, handoffStatus: "ready" as const, handedOffAt: "2026-09-25T18:30:00Z" } };
    mocks.apiFetch.mockResolvedValueOnce(saved).mockResolvedValueOnce(ready);
    const rendered = renderEditor();
    fireEvent.change(screen.getByLabelText("Delivery owner reference"), { target: { value: "delivery-owner:1" } });
    fireEvent.change(screen.getByLabelText("Contact name"), { target: { value: "Test Owner" } });
    fireEvent.change(screen.getByLabelText("Contact detail"), { target: { value: "owner@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Save owner and contact" }));

    await waitFor(() => expect(mocks.apiFetch).toHaveBeenCalledTimes(1));
    expect(mocks.apiFetch).toHaveBeenNthCalledWith(1, "/api/staff/advisory-bookings/booking-a/delivery", expect.objectContaining({
      method: "PATCH",
      headers: { "If-Match": "8" },
      body: JSON.stringify({ ownerRef: "delivery-owner:1", contact: { name: "Test Owner", channel: "email", value: "owner@example.test" }, contactVerified: false }),
    }));
    expect(screen.getByText(/Details saved as pending/)).toBeTruthy();

    rendered.unmount();
    renderEditor(saved);
    fireEvent.click(screen.getByRole("button", { name: "Confirm verified unchanged details" }));
    await waitFor(() => expect(mocks.apiFetch).toHaveBeenCalledTimes(2));
    expect(mocks.apiFetch).toHaveBeenNthCalledWith(2, "/api/staff/advisory-bookings/booking-a/delivery", expect.objectContaining({
      headers: { "If-Match": "9" },
      body: JSON.stringify({ ownerRef: "delivery-owner:1", contact: { name: "Test Owner", channel: "email", value: "owner@example.test" }, contactVerified: true }),
    }));
  });

  it("disables confirmation when contact changes and keeps rollout-off controls absent", async () => {
    const current = { ...booking, delivery: { ownerRef: "delivery-owner:1", contact: { name: "Test Owner", channel: "email", value: "owner@example.test" }, handoffStatus: "pending" as const, handedOffAt: null } };
    const { unmount } = renderEditor(current);
    const confirm = screen.getByRole("button", { name: "Confirm verified unchanged details" });
    expect(confirm).not.toBeDisabled();
    fireEvent.change(screen.getByLabelText("Contact detail"), { target: { value: "changed@example.test" } });
    expect(confirm).toBeDisabled();
    unmount();
    vi.stubEnv("NEXT_PUBLIC_ADVISORY_DELIVERY_HANDOFFS_ENABLED", "false");
    renderEditor();
    expect(screen.queryByRole("region", { name: "Delivery handoff" })).toBeNull();
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });
});
