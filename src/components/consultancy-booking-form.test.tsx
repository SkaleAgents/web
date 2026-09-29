import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConsultancyBookingForm } from "@/components/consultancy-booking-form";
import { ConsultancyBookingDetail } from "@/components/consultancy-booking-detail";
import type { ConsultancyBooking, ConsultancyPackage } from "@/lib/api";

afterEach(cleanup);

const packages: ConsultancyPackage[] = [
  { slug: "light", name: "Light", durationMinutes: 30, priceCents: 14900, currency: "USD", features: ["Google Meet", "Two focused guidelines"] },
  { slug: "pro", name: "Pro", durationMinutes: 60, priceCents: 24900, currency: "USD", features: ["Infrastructure review"] },
  { slug: "max", name: "Max", durationMinutes: 60, priceCents: 34900, currency: "USD", features: ["Written follow-up notes"] },
];

const booking: ConsultancyBooking = {
  id: "booking-1", version: 2, status: "requested", paymentStatus: "unpaid", package: packages[0],
  requestedWindow: { startAt: "2026-10-06T09:00:00Z", endAt: "2026-10-06T09:30:00Z" },
  approvedWindow: null, proposedWindow: null, scope: "Review public ingress", notes: null, source: null,
  termsVersion: null, approvedAt: null, paidAt: null, confirmedAt: null, meetingUrl: null,
  cancelledAt: null, refundStatus: null, refundedAt: null, deliveredAt: null,
  createdAt: "2026-09-29T09:00:00Z", updatedAt: "2026-09-29T09:00:00Z",
};

describe("native consultancy form", () => {
  it("shows fixed package prices and a timezone-specific slot", () => {
    render(<ConsultancyBookingForm packages={packages} slots={["2026-10-06T15:00:00+06:00"]}
      timezone="Asia/Dhaka" availabilityState="ready" onPackageChange={vi.fn()}
      onTimezoneChange={vi.fn()} onSubmit={vi.fn()} pending={false} />);
    expect(screen.getByText(/Light.*\$149/)).toBeVisible();
    expect(screen.getByText(/Pro.*\$249/)).toBeVisible();
    expect(screen.getByText(/Max.*\$349/)).toBeVisible();
    expect(screen.getByText(/Asia\/Dhaka/)).toBeVisible();
    expect(screen.getByRole("option", { name: /Oct 6/ })).toBeInTheDocument();
    expect(screen.getByText(/Payment comes after approval/)).toBeVisible();
  });

  it("fails closed when Calendar availability is unavailable", () => {
    render(<ConsultancyBookingForm packages={packages} slots={[]} timezone="UTC"
      availabilityState="unavailable" onPackageChange={vi.fn()} onTimezoneChange={vi.fn()}
      onSubmit={vi.fn()} pending={false} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Availability is temporarily unavailable");
    expect(screen.getByRole("button", { name: "Request this time" })).toBeDisabled();
  });
});

describe("native consultancy booking detail", () => {
  it("never offers payment before approval", () => {
    render(<ConsultancyBookingDetail booking={booking} onPay={vi.fn()} onCancel={vi.fn()} onAcceptSlot={vi.fn()} />);
    expect(screen.getByText("Waiting for approval")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Pay for booking" })).not.toBeInTheDocument();
  });

  it("shows payment only after approval and keeps a returned checkout pending", () => {
    const approved = { ...booking, status: "approved_awaiting_payment" as const, approvedAt: "2026-09-29T10:00:00Z" };
    render(<ConsultancyBookingDetail booking={approved} checkoutReturned onPay={vi.fn()} onCancel={vi.fn()} onAcceptSlot={vi.fn()} />);
    expect(screen.getByText("Payment pending")).toBeVisible();
    expect(screen.getByRole("button", { name: "Pay for booking" })).toBeVisible();
    expect(screen.queryByText("Paid and confirmed")).not.toBeInTheDocument();
  });

  it("shows the private Meet link only after confirmed payment", () => {
    const confirmed = { ...booking, status: "confirmed" as const, paymentStatus: "paid" as const,
      meetingUrl: "https://meet.google.com/test-meeting" };
    render(<ConsultancyBookingDetail booking={confirmed} onPay={vi.fn()} onCancel={vi.fn()} onAcceptSlot={vi.fn()} />);
    expect(screen.getByText("Paid and confirmed")).toBeVisible();
    expect(screen.getByRole("link", { name: "Join Google Meet" })).toHaveAttribute("href", confirmed.meetingUrl);
  });
});
