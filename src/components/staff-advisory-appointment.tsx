"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { advisoryAgreementsEnabled, ApiError, apiFetch, ensureCsrfCookie, type StaffAdvisoryBooking } from "@/lib/api";
import { isoToLocalDateTime, isValidTimeZone, localDateTimeToIso } from "@/lib/advisory-appointment-time";
import { Button, FieldLabel, TextInput } from "@/components/ui";
import { useStaffUserId } from "@/components/staff-access";

function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function StaffAdvisoryAppointment({ booking, onRefresh }: { booking: StaffAdvisoryBooking; onRefresh: () => Promise<unknown> }) {
  const userId = useStaffUserId();
  const queryClient = useQueryClient();
  const [timeZone, setTimeZone] = useState(booking.appointment?.confirmedWindow.timezone ?? browserTimeZone());
  const [startAt, setStartAt] = useState(() => booking.appointment ? isoToLocalDateTime(booking.appointment.confirmedWindow.startAt, booking.appointment.confirmedWindow.timezone) : "");
  const [endAt, setEndAt] = useState(() => booking.appointment ? isoToLocalDateTime(booking.appointment.confirmedWindow.endAt, booking.appointment.confirmedWindow.timezone) : "");
  const [validationError, setValidationError] = useState("");
  const [staleVersion, setStaleVersion] = useState<number | null>(null);
  const [refreshedAfterConflict, setRefreshedAfterConflict] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const submitting = useRef(false);
  const base = `/api/staff/advisory-bookings/${encodeURIComponent(booking.id)}`;
  const stale = staleVersion !== null;

  const confirm = useMutation({
    mutationFn: async () => {
      const startIso = localDateTimeToIso(startAt, timeZone);
      const endIso = localDateTimeToIso(endAt, timeZone);
      if (!startIso || !endIso || Date.parse(endIso) <= Date.parse(startIso)) {
        throw new Error("Enter a valid start and end in the selected timezone. End must be after start; daylight-saving gaps are not valid times.");
      }
      await ensureCsrfCookie();
      return apiFetch<StaffAdvisoryBooking>(`${base}/appointment`, {
        method: "PATCH",
        headers: { "If-Match": String(booking.version) },
        body: JSON.stringify({ confirmedWindow: { startAt: startIso, endAt: endIso, timezone: timeZone } }),
      });
    },
    onSuccess: (updated) => {
      submitting.current = false;
      setStaleVersion(null);
      queryClient.setQueryData(["staff-bookings", userId, booking.id], updated);
      void queryClient.invalidateQueries({ queryKey: ["staff-bookings", userId] });
    },
    onError: (error) => {
      submitting.current = false;
      if (error instanceof ApiError && error.status === 409) {
        setStaleVersion(booking.version);
        setRefreshedAfterConflict(false);
        void queryClient.invalidateQueries({ queryKey: ["staff-bookings", userId, booking.id], exact: true });
      }
      if (error instanceof ApiError && [401, 403].includes(error.status)) void queryClient.invalidateQueries({ queryKey: ["user"], exact: true });
    },
    onSettled: () => { submitting.current = false; },
  });

  if (!advisoryAgreementsEnabled()) return null;

  const clearStaleAndLoadCurrent = () => {
    if (!refreshedAfterConflict) return;
    const appointment = booking.appointment;
    setTimeZone(appointment?.confirmedWindow.timezone ?? browserTimeZone());
    setStartAt(appointment ? isoToLocalDateTime(appointment.confirmedWindow.startAt, appointment.confirmedWindow.timezone) : "");
    setEndAt(appointment ? isoToLocalDateTime(appointment.confirmedWindow.endAt, appointment.confirmedWindow.timezone) : "");
    setStaleVersion(null);
    confirm.reset();
  };

  const refreshAfterConflict = async () => {
    setRefreshing(true);
    try {
      const result = await onRefresh();
      if (result && typeof result === "object" && "isSuccess" in result && result.isSuccess) setRefreshedAfterConflict(true);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section aria-label="Confirm appointment" className="space-y-4 rounded-xl border border-line bg-canvas-elevated p-5">
      <div>
        <h2 className="text-lg font-semibold">Confirmed appointment</h2>
        <p className="mt-1 text-sm text-ink-muted">The customer&apos;s preferred window is a request only. Confirmed time is recorded separately and does not sync a calendar or send email.</p>
      </div>
      <div className="rounded-lg bg-canvas p-4 text-sm">
        <h3 className="font-semibold">Customer preferred window (not confirmed)</h3>
        <p className="mt-1">{new Date(booking.preferredWindow.startAt).toLocaleString()} to {new Date(booking.preferredWindow.endAt).toLocaleString()} ({Intl.DateTimeFormat().resolvedOptions().timeZone || "local timezone"})</p>
      </div>
      {booking.appointment && (
        <div className="rounded-lg border border-line p-4 text-sm">
          <h3 className="font-semibold">Confirmed window ({booking.appointment.confirmedWindow.timezone})</h3>
          <p className="mt-1">{new Date(booking.appointment.confirmedWindow.startAt).toLocaleString("en", { timeZone: booking.appointment.confirmedWindow.timezone, timeZoneName: "short" })} to {new Date(booking.appointment.confirmedWindow.endAt).toLocaleString("en", { timeZone: booking.appointment.confirmedWindow.timezone, timeZoneName: "short" })}</p>
          <p className="mt-1 text-ink-muted">Confirmed at {new Date(booking.appointment.confirmedAt).toLocaleString()}</p>
        </div>
      )}
      {stale && <p role="alert" className="text-sm text-danger">The booking changed. Review the refreshed booking before confirming or replacing the appointment.</p>}
      {stale && <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" disabled={refreshing} onClick={() => void refreshAfterConflict()}>{refreshing ? "Refreshing…" : "Refresh booking"}</Button><Button type="button" disabled={!refreshedAfterConflict} onClick={clearStaleAndLoadCurrent}>Review refreshed booking</Button></div>}
      {!stale && (
        <form className="space-y-4" onSubmit={(event) => {
          event.preventDefault();
          if (!confirm.isPending && !submitting.current) {
            setValidationError("");
            if (!isValidTimeZone(timeZone)) {
              setValidationError("Enter a valid IANA timezone, such as America/Los_Angeles.");
              return;
            }
            submitting.current = true;
            confirm.mutate();
          }
        }}>
          <label className="block"><FieldLabel>Timezone (IANA)</FieldLabel><TextInput required value={timeZone} disabled={confirm.isPending} onChange={(event) => setTimeZone(event.target.value)} className="mt-1" placeholder="America/Los_Angeles" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><FieldLabel>Confirmed start in selected timezone</FieldLabel><TextInput required type="datetime-local" value={startAt} disabled={confirm.isPending} onChange={(event) => setStartAt(event.target.value)} className="mt-1" /></label>
            <label className="block"><FieldLabel>Confirmed end in selected timezone</FieldLabel><TextInput required type="datetime-local" value={endAt} disabled={confirm.isPending} onChange={(event) => setEndAt(event.target.value)} className="mt-1" /></label>
          </div>
      <p className="text-xs text-ink-muted">The entered wall-clock times use {timeZone || "the selected timezone"}. The API stores RFC3339 timestamps with that timezone&apos;s UTC offset. Daylight-saving gaps and repeated wall-clock times are rejected to avoid choosing the wrong offset.</p>
          {validationError && <p role="alert" className="text-sm text-danger">{validationError}</p>}
          <Button type="submit" disabled={confirm.isPending || !startAt || !endAt}>{confirm.isPending ? "Saving appointment…" : booking.appointment ? "Replace confirmed window" : "Confirm appointment"}</Button>
          {confirm.isSuccess && <p role="status" className="text-sm text-accent">Appointment confirmed at {new Date(confirm.data.appointment!.confirmedAt).toLocaleString()}.</p>}
          {confirm.isError && <p role="alert" className="text-sm text-danger">{confirm.error instanceof ApiError && confirm.error.status === 409 ? "The booking changed. Refresh and review the current appointment before trying again." : confirm.error.message}</p>}
        </form>
      )}
    </section>
  );
}
