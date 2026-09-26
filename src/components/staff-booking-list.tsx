"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, ApiError, type AdvisoryBooking } from "@/lib/api";
import { bookingStatusLabels, type BookingStatus } from "@/lib/advisory-bookings";
import { useStaffUserId } from "@/components/staff-access";
import { Button, FieldLabel, LinkButton, Select } from "@/components/ui";

export function StaffBookingList() {
  const userId = useStaffUserId();
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const bookings = useQuery({
    queryKey: ["staff-bookings", userId],
    queryFn: async () => (await apiFetch<{ bookings: AdvisoryBooking[] }>("/api/staff/advisory-bookings")).bookings,
    retry: false,
    gcTime: 0,
  });
  const denied = bookings.error instanceof ApiError && [401, 403].includes(bookings.error.status);
  const visible = bookings.data?.filter((booking) => status === "all" || booking.status === status) ?? [];

  return (
    <main className="space-y-6">
      <div className="workspace-intro">
        <p className="workspace-kicker">Staff / Advisory operations</p>
        <h1 className="workspace-heading">Advisory bookings</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">Review requests across accounts. Manage assignment, work status, and recorded fees.</p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="w-full sm:w-56">
          <FieldLabel>Status</FieldLabel>
          <Select className="mt-1" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="all">All statuses</option>
            {Object.entries(bookingStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </label>
        <Button variant="secondary" onClick={() => void bookings.refetch()} disabled={bookings.isFetching}>
          {bookings.isFetching ? "Refreshing…" : "Refresh bookings"}
        </Button>
      </div>
      {bookings.isPending ? <p role="status" className="text-sm text-ink-muted">Loading bookings…</p> : bookings.isError ? (
        <div role="alert" className="space-y-3 rounded-xl border border-line p-5">
          <p className="text-danger">{denied ? "Staff access is no longer available. Sign in with a staff account to continue." : bookings.error.message}</p>
          {denied && <LinkButton href="/login" variant="secondary">Sign in</LinkButton>}
        </div>
      ) : visible.length === 0 ? (
        <p role="status" className="rounded-xl border border-dashed border-line p-6 text-sm text-ink-muted">
          {bookings.data?.length === 0 ? "No advisory requests yet." : "No bookings match this status."}
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-canvas-elevated">
          {visible.map((booking) => (
            <li key={booking.id}>
              <Link href={`/dashboard/staff/advisory-bookings/${booking.id}`} className="block space-y-3 p-5 hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-accent-soft px-2 py-1 font-semibold text-ink">{bookingStatusLabels[booking.status]}</span>
                  <span className={booking.urgency === "emergency" || booking.urgency === "urgent" ? "font-semibold text-danger" : "text-ink-muted"}>{booking.urgency}</span>
                  <span className="font-mono text-ink-muted">#{booking.id.slice(0, 8)}</span>
                </div>
                <h2 className="line-clamp-2 break-words font-semibold text-ink">{booking.scope}</h2>
                <div className="flex flex-wrap justify-between gap-2 text-xs text-ink-muted">
                  <p>Preferred: {new Date(booking.preferredWindow.startAt).toLocaleString()}</p>
                  <p className="break-all">{booking.assigneeRef ? `Assigned: ${booking.assigneeRef}` : "Unassigned"}</p>
                </div>
                <span className="block text-sm font-semibold text-accent">Open booking</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
