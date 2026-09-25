"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiFetch, type AdvisoryBooking } from "@/lib/api";
import { bookingStatusLabels } from "@/lib/advisory-bookings";
import { useCustomerUser, isSessionError } from "@/components/customer-booking-access";
import { Button, LinkButton } from "@/components/ui";

function bookingListKey(accountId: string) {
  return ["customer-advisory-bookings", accountId] as const;
}

function bookingDetailKey(accountId: string, bookingId: string) {
  return ["customer-advisory-booking", accountId, bookingId] as const;
}

function handleSessionExpiry(queryClient: ReturnType<typeof useQueryClient>, queryKey: readonly unknown[], error: unknown) {
  if (!isSessionError(error)) return;
  queryClient.removeQueries({ queryKey });
  void queryClient.invalidateQueries({ queryKey: ["user"], exact: true });
}

function BookingSummary({ booking }: { booking: AdvisoryBooking }) {
  return (
    <Link href={`/advisory-bookings/${encodeURIComponent(booking.id)}`} className="block space-y-3 p-5 hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-accent-soft px-2 py-1 font-semibold text-ink">{bookingStatusLabels[booking.status]}</span>
        <span className="text-ink-muted">{booking.urgency} priority</span>
        <span className="font-mono text-ink-muted">#{booking.id.slice(0, 8)}</span>
      </div>
      <h2 className="line-clamp-2 break-words font-semibold text-ink">{booking.scope}</h2>
      <p className="text-xs text-ink-muted">Preferred window (requested, not confirmed): {formatWindow(booking.preferredWindow)}</p>
      <span className="block text-sm font-semibold text-accent">View request</span>
    </Link>
  );
}

function formatWindow(window: AdvisoryBooking["preferredWindow"]) {
  return `${new Date(window.startAt).toLocaleString()} to ${new Date(window.endAt).toLocaleString()}`;
}

export function CustomerBookingList() {
  const user = useCustomerUser();
  const queryClient = useQueryClient();
  const key = useMemo(() => bookingListKey(user.id), [user.id]);
  const bookings = useQuery({
    queryKey: key,
    queryFn: async ({ signal }) => (await apiFetch<{ bookings: AdvisoryBooking[] }>("/api/advisory-bookings", { signal })).bookings,
    retry: false,
    gcTime: 0,
  });
  const denied = isSessionError(bookings.error);

  useEffect(() => handleSessionExpiry(queryClient, key, bookings.error), [bookings.error, key, queryClient]);

  return (
    <main className="space-y-6">
      <div className="workspace-intro">
        <p className="workspace-kicker">Review / Your requests</p>
        <h1 className="workspace-heading">Advisory requests</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">Track request status, the preferred window you submitted, and any recorded fee.</p>
      </div>
      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => void bookings.refetch()} disabled={bookings.isFetching}>
          {bookings.isFetching ? "Refreshing…" : "Refresh requests"}
        </Button>
      </div>
      {bookings.isPending ? <p role="status" className="text-sm text-ink-muted">Loading advisory requests…</p> : bookings.isError ? (
        <div role="alert" className="space-y-3 rounded-xl border border-line p-5">
          <p className="text-danger">{denied ? "Your session or account access changed. Sign in again to view your requests." : bookings.error.message}</p>
          {denied && <LinkButton href="/login" variant="secondary">Sign in</LinkButton>}
        </div>
      ) : bookings.data.length === 0 ? (
        <p role="status" className="rounded-xl border border-dashed border-line p-6 text-sm text-ink-muted">You have no advisory requests yet.</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-canvas-elevated">
          {bookings.data.map((booking) => <li key={booking.id}><BookingSummary booking={booking} /></li>)}
        </ul>
      )}
    </main>
  );
}

export function CustomerBookingDetail({ id }: { id: string }) {
  const user = useCustomerUser();
  const queryClient = useQueryClient();
  const key = useMemo(() => bookingDetailKey(user.id, id), [user.id, id]);
  const booking = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => apiFetch<AdvisoryBooking>(`/api/advisory-bookings/${encodeURIComponent(id)}`, { signal }),
    retry: false,
    gcTime: 0,
  });
  const denied = isSessionError(booking.error);
  const notFound = booking.error instanceof ApiError && booking.error.status === 404;
  const data = booking.data;

  useEffect(() => handleSessionExpiry(queryClient, key, booking.error), [booking.error, id, key, queryClient]);

  return (
    <main className="space-y-6">
      <LinkButton href="/advisory-bookings" variant="ghost">Back to advisory requests</LinkButton>
      {denied || notFound ? (
        <div className="space-y-3">
          <h1 className="workspace-heading">{denied ? "Sign in required" : "Request unavailable"}</h1>
          <p role="alert" className="text-sm text-ink-muted">{denied ? "Your session or account access changed. Sign in again to view your requests." : "This request is unavailable or has been removed."}</p>
          {denied && <LinkButton href="/login">Sign in</LinkButton>}
        </div>
      ) : booking.isPending ? <p role="status" className="text-sm text-ink-muted">Loading advisory request…</p> : booking.isError || !data ? (
        <div className="space-y-3">
          <p role="alert" className="text-danger">{booking.error?.message ?? "Unable to load this request."}</p>
          <Button onClick={() => void booking.refetch()} disabled={booking.isFetching}>Try again</Button>
        </div>
      ) : (
        <>
          <div className="workspace-intro">
            <p className="workspace-kicker">Review / Your request</p>
            <h1 className="workspace-heading">Advisory request #{data.id.slice(0, 8)}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold">{bookingStatusLabels[data.status]}</span>
              <span className="text-sm text-ink-muted">{data.urgency} priority</span>
              <Button variant="secondary" disabled={booking.isFetching} onClick={() => void booking.refetch()}>{booking.isFetching ? "Refreshing…" : "Refresh request"}</Button>
            </div>
          </div>
          <section aria-label="Request details" className="space-y-4 rounded-xl border border-line bg-canvas-elevated p-5">
            <h2 className="text-lg font-semibold">Requested scope</h2>
            <p className="whitespace-pre-wrap break-words text-sm">{data.scope}</p>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-ink-muted">Preferred window (requested, not confirmed)</dt>
                <dd className="mt-1">{formatWindow(data.preferredWindow)}</dd>
                <p className="mt-1 text-xs text-ink-muted">This is the time window you requested. It is not a confirmed appointment.</p>
              </div>
              <div>
                <dt className="text-ink-muted">Source</dt>
                <dd className="mt-1 break-all">
                  {data.source.type === "watchtower_session" ? (
                    <Link className="text-accent underline" href={`/watchtower/${encodeURIComponent(data.source.id)}`}>Open source Watchtower session</Link>
                  ) : <span>Audit job reference (no direct source page available)</span>}
                  <span className="mt-1 block font-mono text-xs text-ink-muted">{data.source.id}</span>
                </dd>
              </div>
            </dl>
            {data.notes && <div><h3 className="text-sm text-ink-muted">Your notes</h3><p className="mt-1 whitespace-pre-wrap break-words text-sm">{data.notes}</p></div>}
          </section>
          <section aria-label="Assignment" className="rounded-xl border border-line bg-canvas-elevated p-5">
            <h2 className="text-lg font-semibold">Assignment</h2>
            <p className="mt-2 break-all font-mono text-sm">{data.assigneeRef ?? "No assignment recorded"}</p>
            {data.assigneeRef && <p className="mt-1 text-xs text-ink-muted">This is an internal reference, not a contact detail.</p>}
          </section>
          <section aria-label="Recorded fee" className="rounded-xl border border-line bg-canvas-elevated p-5">
            <h2 className="text-lg font-semibold">Recorded fee</h2>
            {data.billing.feeCents === null ? (
              <p className="mt-2 text-sm text-ink-muted">No fee amount has been recorded.</p>
            ) : (
              <>
                <p className="mt-2 text-sm">{data.billing.currency ? `${(data.billing.feeCents / 100).toFixed(2)} ${data.billing.currency}` : `${data.billing.feeCents} cents (currency not recorded)`}</p>
                <p className="mt-1 text-xs text-ink-muted">This amount is recorded for staff tracking. It is not a payment confirmation.</p>
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}
