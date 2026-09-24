"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError, ensureCsrfCookie, type AdvisoryBookingHistoryEntry, type StaffAdvisoryBooking } from "@/lib/api";
import { bookingStatusLabels, bookingTransitions, isClosedBooking, type BookingStatus } from "@/lib/advisory-bookings";
import { useStaffUserId } from "@/components/staff-access";
import { Button, FieldLabel, LinkButton, Select, TextInput } from "@/components/ui";

type BookingChange =
  | { action: "assignment"; body: { assigneeRef: string } }
  | { action: "status"; body: { status: BookingStatus } }
  | { action: "billing"; body: { billing: { billableMinutes: number; feeCents: number; currency: string } } };

type EditorProps = {
  booking: StaffAdvisoryBooking;
  disabled: boolean;
  save: (change: BookingChange) => void;
};

function StatusEditor({ booking, disabled, save }: EditorProps) {
  const [next, setNext] = useState<BookingStatus | "">("");
  const transitions = bookingTransitions[booking.status];
  return (
    <section className="rounded-xl border border-line bg-canvas-elevated p-5">
      <h2 className="text-lg font-semibold">Work status</h2>
      {transitions.length === 0 ? <p className="mt-3 text-sm text-ink-muted">This booking is closed. Its status cannot change.</p> : (
        <form className="mt-4 space-y-3" onSubmit={(event) => {
          event.preventDefault();
          if (next && transitions.includes(next)) save({ action: "status", body: { status: next } });
        }}>
          <label className="block">
            <FieldLabel>Next status</FieldLabel>
            <Select required value={next} disabled={disabled} className="mt-1" onChange={(event) => setNext(event.target.value as BookingStatus)}>
              <option value="">Choose a transition</option>
              {transitions.map((value) => <option key={value} value={value}>{bookingStatusLabels[value]}</option>)}
            </Select>
          </label>
          <Button type="submit" disabled={disabled || !next}>Change status</Button>
        </form>
      )}
    </section>
  );
}

function AssignmentEditor({ booking, disabled, save }: EditorProps) {
  const [reference, setReference] = useState(booking.assigneeRef ?? "");
  const assignable = booking.status !== "requested" && !isClosedBooking(booking.status);
  return (
    <section className="rounded-xl border border-line bg-canvas-elevated p-5">
      <h2 className="text-lg font-semibold">Expert assignment</h2>
      {!assignable ? (
        <div className="mt-3 space-y-2 text-sm text-ink-muted">
          <p className="break-all">{booking.assigneeRef ?? "Unassigned"}</p>
          <p>{booking.status === "requested" ? "Accept the request before assigning an expert." : "Assignment is fixed after the booking closes."}</p>
        </div>
      ) : (
        <form className="mt-4 space-y-3" onSubmit={(event) => {
          event.preventDefault();
          save({ action: "assignment", body: { assigneeRef: reference } });
        }}>
          <label className="block">
            <FieldLabel>Expert reference</FieldLabel>
            <TextInput required maxLength={255} pattern="[A-Za-z0-9][A-Za-z0-9._:\-]*" value={reference} disabled={disabled} className="mt-1 font-mono text-sm" placeholder="expert:001" aria-describedby="expert-reference-help" onChange={(event) => setReference(event.target.value)} />
          </label>
          <p id="expert-reference-help" className="text-xs text-ink-muted">Use an opaque reference, not an email or provider account ID. Start with a letter or digit; dots, underscores, colons, and hyphens are allowed.</p>
          <Button type="submit" disabled={disabled || !reference || reference === booking.assigneeRef}>Save assignment</Button>
        </form>
      )}
    </section>
  );
}

function BillingEditor({ booking, disabled, save }: EditorProps) {
  const [minutes, setMinutes] = useState(String(booking.billing.billableMinutes ?? ""));
  const [fee, setFee] = useState(String(booking.billing.feeCents ?? ""));
  const [currency, setCurrency] = useState(booking.billing.currency ?? "USD");
  const [error, setError] = useState("");
  return (
    <section className="rounded-xl border border-line bg-canvas-elevated p-5">
      <h2 className="text-lg font-semibold">Recorded billing</h2>
      <p className="mt-2 text-sm text-ink-muted">Record the agreed fee in cents. Saving these values does not collect payment.</p>
      {!isClosedBooking(booking.status) ? <p className="mt-3 text-sm text-ink-muted">Complete or cancel the booking before recording billing.</p> : (
        <form className="mt-4 space-y-4" onSubmit={(event) => {
          event.preventDefault();
          const billableMinutes = Number(minutes);
          const feeCents = Number(fee);
          if (!minutes.trim() || !fee.trim() || !Number.isSafeInteger(billableMinutes) || billableMinutes < 0 || !Number.isSafeInteger(feeCents) || feeCents < 0 || !/^[A-Z]{3}$/.test(currency)) {
            setError("Enter non-negative whole numbers and a three-letter uppercase currency code.");
            return;
          }
          setError("");
          save({ action: "billing", body: { billing: { billableMinutes, feeCents, currency } } });
        }}>
          <div className="grid gap-4 sm:grid-cols-3">
            <label><FieldLabel>Billable minutes</FieldLabel><TextInput required type="number" min={0} max={Number.MAX_SAFE_INTEGER} step={1} value={minutes} disabled={disabled} className="mt-1" onChange={(event) => setMinutes(event.target.value)} /></label>
            <label><FieldLabel>Fee (cents)</FieldLabel><TextInput required type="number" min={0} max={Number.MAX_SAFE_INTEGER} step={1} value={fee} disabled={disabled} className="mt-1" onChange={(event) => setFee(event.target.value)} /></label>
            <label><FieldLabel>Currency</FieldLabel><TextInput required pattern="[A-Z]{3}" maxLength={3} value={currency} disabled={disabled} className="mt-1" placeholder="USD" onChange={(event) => setCurrency(event.target.value.toUpperCase())} /></label>
          </div>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={disabled}>Save billing</Button>
        </form>
      )}
    </section>
  );
}

function HistoryDescription({ entry }: { entry: AdvisoryBookingHistoryEntry }) {
  if (entry.type === "status") return <p>{entry.fromStatus ? bookingStatusLabels[entry.fromStatus] : "Unknown"} to {entry.toStatus ? bookingStatusLabels[entry.toStatus] : "Unknown"}</p>;
  if (entry.type === "assignment") return <p className="break-all">Assigned to {entry.assigneeRef ?? "unassigned"}</p>;
  return <p>{entry.billing.billableMinutes ?? "Not recorded"} minutes · {entry.billing.feeCents ?? "Not recorded"} cents · {entry.billing.currency ?? "No currency"}</p>;
}

export function StaffBookingDetail({ id }: { id: string }) {
  const userId = useStaffUserId();
  const queryClient = useQueryClient();
  const queryKey = ["staff-bookings", userId, id];
  const base = `/api/staff/advisory-bookings/${encodeURIComponent(id)}`;
  const booking = useQuery({
    queryKey,
    queryFn: () => apiFetch<StaffAdvisoryBooking>(base),
    retry: false,
    gcTime: 0,
  });
  const update = useMutation({
    mutationFn: async (change: BookingChange) => {
      await ensureCsrfCookie();
      return apiFetch<StaffAdvisoryBooking>(`${base}/${change.action}`, { method: "PATCH", body: JSON.stringify(change.body) });
    },
    onSuccess: (result) => {
      queryClient.setQueryData(queryKey, result);
      void queryClient.invalidateQueries({ queryKey: ["staff-bookings", userId], exact: true });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) void queryClient.invalidateQueries({ queryKey });
      if (error instanceof ApiError && [401, 403].includes(error.status)) void queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
  const error = update.error ?? booking.error;
  const denied = error instanceof ApiError && [401, 403].includes(error.status);
  const notFound = error instanceof ApiError && error.status === 404;
  const data = booking.data;

  return (
    <main className="space-y-6">
      <LinkButton href="/staff/advisory-bookings" variant="ghost">Back to bookings</LinkButton>
      {denied || notFound ? (
        <div className="space-y-3">
          <h1 className="workspace-heading">{denied ? "Staff access required" : "Booking not found"}</h1>
          <p role="alert" className="text-sm text-ink-muted">{denied ? "Your session or staff access has changed. Sign in with a staff account to continue." : "This booking is unavailable or has been removed."}</p>
          {denied && <LinkButton href="/login">Sign in</LinkButton>}
        </div>
      ) : booking.isPending ? <p role="status" className="text-sm text-ink-muted">Loading booking…</p> : booking.isError || !data ? (
        <div className="space-y-3">
          <p role="alert" className="text-danger">{booking.error?.message ?? "Unable to load booking."}</p>
          <Button onClick={() => void booking.refetch()} disabled={booking.isFetching}>Try again</Button>
        </div>
      ) : (
        <>
          <div className="workspace-intro">
            <p className="workspace-kicker">Staff / Advisory operations</p>
            <h1 className="workspace-heading">Booking #{data.id.slice(0, 8)}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold">{bookingStatusLabels[data.status]}</span>
              <span className="text-sm text-ink-muted">{data.urgency} priority</span>
              <Button variant="secondary" disabled={booking.isFetching || update.isPending} onClick={() => void booking.refetch()}>{booking.isFetching ? "Refreshing…" : "Refresh booking"}</Button>
            </div>
          </div>
          <section aria-label="Request details" className="space-y-4 rounded-xl border border-line bg-canvas-elevated p-5">
            <h2 className="text-lg font-semibold">Requested scope</h2>
            <p className="whitespace-pre-wrap break-words text-sm">{data.scope}</p>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-ink-muted">Preferred window (your timezone)</dt><dd className="mt-1">{new Date(data.preferredWindow.startAt).toLocaleString()} to {new Date(data.preferredWindow.endAt).toLocaleString()}</dd></div>
              <div><dt className="text-ink-muted">Source</dt><dd className="mt-1 break-all">{data.source.type === "audit_job" ? "Audit job" : "Watchtower session"}: <span className="font-mono text-xs">{data.source.id}</span></dd></div>
            </dl>
            {data.notes && <div><h3 className="text-sm text-ink-muted">Customer notes</h3><p className="mt-1 whitespace-pre-wrap break-words text-sm">{data.notes}</p></div>}
          </section>
          <div aria-live="polite">
            {update.isPending && <p role="status" className="text-sm text-ink-muted">Saving change…</p>}
            {update.isSuccess && <p role="status" className="text-sm text-accent">Booking updated.</p>}
            {update.isError && <p role="alert" className="text-sm text-danger">{update.error instanceof ApiError && update.error.status === 409 ? "The booking state changed or this action is no longer allowed. Review the refreshed booking and try again." : update.error.message}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <StatusEditor key={data.status} booking={data} disabled={update.isPending || booking.isFetching} save={(change) => update.mutate(change)} />
            <AssignmentEditor key={data.assigneeRef ?? "unassigned"} booking={data} disabled={update.isPending || booking.isFetching} save={(change) => update.mutate(change)} />
          </div>
          <BillingEditor key={JSON.stringify(data.billing)} booking={data} disabled={update.isPending || booking.isFetching} save={(change) => update.mutate(change)} />
          <section className="rounded-xl border border-line bg-canvas-elevated p-5">
            <h2 className="text-lg font-semibold">Booking history</h2>
            <p className="mt-1 text-sm text-ink-muted">Recorded changes and staff references. Times use your timezone.</p>
            {data.history.length === 0 ? <p className="mt-4 text-sm text-ink-muted">No staff changes yet.</p> : (
              <ol className="mt-4 divide-y divide-line">
                {data.history.map((entry) => (
                  <li key={entry.id} className="space-y-1 py-4 text-sm">
                    <HistoryDescription entry={entry} />
                    <time dateTime={entry.createdAt} className="block text-xs text-ink-muted">{new Date(entry.createdAt).toLocaleString()}</time>
                    <p className="break-all font-mono text-xs text-ink-muted">Staff: {entry.actorRef}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </main>
  );
}
