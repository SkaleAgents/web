import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { StaffConsultancyQueue } from "@/components/staff-consultancy-queue";
import type { ConsultancyBooking } from "@/lib/api";

afterEach(cleanup);

it("lets staff approve a requested slot without exposing a payment action", () => {
  const approve = vi.fn();
  const booking = {
    id: "booking-1", version: 1, status: "requested", paymentStatus: "unpaid",
    package: { slug: "light", name: "Light", durationMinutes: 30, priceCents: 14900, currency: "USD", features: [] },
    requestedWindow: { startAt: "2026-10-06T09:00:00Z", endAt: "2026-10-06T09:30:00Z" },
    approvedWindow: null, proposedWindow: null, scope: "Review ingress", notes: null, source: null,
    termsVersion: null, approvedAt: null, paidAt: null, confirmedAt: null, meetingUrl: null,
    cancelledAt: null, refundStatus: null, refundedAt: null, deliveredAt: null,
    createdAt: "2026-09-29T09:00:00Z", updatedAt: "2026-09-29T09:00:00Z",
  } satisfies ConsultancyBooking;
  render(<StaffConsultancyQueue bookings={[booking]} onApprove={approve} onDecline={vi.fn()}
    onRefund={vi.fn()} onDeliver={vi.fn()} busyId={null} />);
  expect(screen.getByText("Review ingress")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Approve slot" }));
  expect(approve).toHaveBeenCalledWith(booking);
  expect(screen.queryByRole("button", { name: "Pay for booking" })).not.toBeInTheDocument();
});
