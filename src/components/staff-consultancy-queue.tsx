"use client";

import type { ConsultancyBooking } from "@/lib/api";
import { Button } from "@/components/ui";

export function StaffConsultancyQueue({ bookings, busyId, onApprove, onDecline, onRefund, onDeliver }: {
  bookings: ConsultancyBooking[];
  busyId: string | null;
  onApprove: (booking: ConsultancyBooking) => void;
  onDecline: (booking: ConsultancyBooking) => void;
  onRefund: (booking: ConsultancyBooking) => void;
  onDeliver: (booking: ConsultancyBooking) => void;
}) {
  if (bookings.length === 0) return <p className="border-t border-line pt-6 text-sm text-ink-muted">No consultancy requests yet.</p>;

  return <ul className="divide-y divide-line border-y border-line">
    {bookings.map(booking => <li key={booking.id} className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold text-ink">{booking.package.name} · ${(booking.package.priceCents / 100).toFixed(0)}</p>
        <p className="text-sm text-ink-muted">{booking.status.replaceAll("_", " ")}</p>
        <p className="text-sm text-ink">{booking.scope}</p>
        <p className="text-xs text-ink-muted">Requested {new Date(booking.requestedWindow.startAt).toLocaleString()}</p>
      </div>
      <div className="flex flex-wrap items-start gap-2 lg:justify-end">
        {booking.status === "requested" && <>
          <Button type="button" disabled={busyId === booking.id} onClick={() => onApprove(booking)}>Approve slot</Button>
          <Button type="button" variant="secondary" disabled={busyId === booking.id} onClick={() => onDecline(booking)}>Decline</Button>
        </>}
        {booking.refundStatus === "review_required" && <Button type="button" disabled={busyId === booking.id}
          onClick={() => onRefund(booking)}>Approve full refund</Button>}
        {booking.status === "confirmed" && <Button type="button" variant="secondary" disabled={busyId === booking.id}
          onClick={() => onDeliver(booking)}>Record delivery</Button>}
      </div>
    </li>)}
  </ul>;
}
