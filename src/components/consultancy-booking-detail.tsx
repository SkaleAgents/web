"use client";

import type { ConsultancyBooking } from "@/lib/api";
import { Button } from "@/components/ui";

function when(value: string | null): string {
  return value ? new Date(value).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }) : "Not set";
}

function bookingLabel(booking: ConsultancyBooking, checkoutReturned: boolean): string {
  if (booking.paymentStatus === "refunded") return "Refund confirmed";
  if (booking.refundStatus === "review_required") return "Refund under review";
  if (booking.refundStatus === "creating" || booking.refundStatus === "pending_verification") return "Refund pending";
  if (booking.status === "confirmed" || booking.status === "completed") return "Paid and confirmed";
  if (booking.status === "paid_pending_confirmation") return "Paid, waiting for appointment confirmation";
  if (booking.status === "payment_review_required") return "Payment needs review";
  if (booking.status === "cancellation_pending") return "Cancellation pending";
  if (booking.status === "cancelled") return "Canceled";
  if (booking.status === "declined") return "Request declined";
  if (booking.status === "slot_proposed") return "New time proposed";
  if (booking.status === "approved_awaiting_payment") return checkoutReturned ? "Payment pending" : "Approved, ready for payment";
  return "Waiting for approval";
}

export function ConsultancyBookingDetail({ booking, checkoutReturned = false, busy = false, onPay, onCancel, onAcceptSlot }: {
  booking: ConsultancyBooking;
  checkoutReturned?: boolean;
  busy?: boolean;
  onPay: () => void;
  onCancel: () => void;
  onAcceptSlot: () => void;
}) {
  const canCancel = ["requested", "slot_proposed", "approved_awaiting_payment", "paid_pending_confirmation", "confirmed"].includes(booking.status);

  return <article className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
      <div>
        <p className="text-sm font-medium text-ink-muted">{booking.package.name} consultancy</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">{bookingLabel(booking, checkoutReturned)}</h1>
      </div>
      <p className="text-xl font-semibold text-ink">${(booking.package.priceCents / 100).toFixed(0)} <span className="text-sm font-normal text-ink-muted">{booking.package.currency}</span></p>
    </div>

    <dl className="grid gap-5 sm:grid-cols-2">
      <div><dt className="text-sm text-ink-muted">Requested time</dt><dd className="mt-1 font-medium text-ink">{when(booking.requestedWindow.startAt)}</dd></div>
      <div><dt className="text-sm text-ink-muted">Approved time</dt><dd className="mt-1 font-medium text-ink">{when(booking.approvedWindow?.startAt ?? null)}</dd></div>
      <div><dt className="text-sm text-ink-muted">Duration</dt><dd className="mt-1 font-medium text-ink">{booking.package.durationMinutes} minutes</dd></div>
      <div><dt className="text-sm text-ink-muted">Payment</dt><dd className="mt-1 font-medium text-ink">{booking.paymentStatus.replaceAll("_", " ")}</dd></div>
    </dl>
    <div className="border-t border-line pt-5">
      <h2 className="font-semibold text-ink">What you asked about</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">{booking.scope}</p>
    </div>
    {booking.proposedWindow && <div className="rounded-[10px] border border-line bg-canvas-elevated p-4">
      <p className="font-semibold text-ink">Harun proposed {when(booking.proposedWindow.startAt)}</p>
      <p className="mt-1 text-sm text-ink-muted">Accepting this time sends it back for approval. It does not start payment.</p>
      <Button className="mt-3" type="button" disabled={busy} onClick={onAcceptSlot}>Accept proposed time</Button>
    </div>}

    {booking.meetingUrl && booking.status === "confirmed" && <p>
      <a href={booking.meetingUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline">Join Google Meet</a>
    </p>}

    {booking.status === "approved_awaiting_payment" && <div className="space-y-3 border-t border-line pt-5">
      <p className="text-sm text-ink-muted">Your time and price are approved. Checkout opens Stripe. Returning from Stripe does not confirm payment; this page updates after verification.</p>
      <p className="text-sm text-ink-muted">Cancel at least 48 hours before the call for a full refund. Later cancellations go to Harun for review.</p>
      <p className="text-xs text-ink-muted">Terms: {booking.termsVersion ?? "Current package terms"}</p>
      <Button type="button" disabled={busy} onClick={onPay}>Pay for booking</Button>
    </div>}
    {checkoutReturned && booking.status === "approved_awaiting_payment" && <p role="status" className="text-sm text-ink-muted">Payment pending. Refresh this page if the status does not update soon.</p>}
    {canCancel && <div className="border-t border-line pt-5">
      <Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>Cancel booking</Button>
    </div>}
  </article>;
}
