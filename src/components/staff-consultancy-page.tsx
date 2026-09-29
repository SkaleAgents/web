"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError, nativeConsultancyEnabled, type ConsultancyBooking } from "@/lib/api";
import { useStaffUserId } from "@/components/staff-access";
import { StaffConsultancyQueue } from "@/components/staff-consultancy-queue";

export function StaffConsultancyPage() {
  const staffId = useStaffUserId();
  const client = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = ["staff-consultancy-bookings", staffId] as const;
  const bookings = useQuery({
    queryKey: key, enabled: nativeConsultancyEnabled(), retry: false,
    queryFn: async ({ signal }) => (await apiFetch<{ bookings: ConsultancyBooking[] }>("/api/staff/consultancy/bookings", { signal })).bookings,
  });
  const mutation = useMutation({
    mutationFn: ({ booking, action, body }: { booking: ConsultancyBooking; action: string; body?: object }) =>
      apiFetch<ConsultancyBooking>(`/api/staff/consultancy/bookings/${booking.id}/${action}`, {
        method: "POST", headers: { "If-Match": String(booking.version) }, body: body ? JSON.stringify(body) : undefined,
      }),
    onMutate: ({ booking }) => { setBusyId(booking.id); setError(null); },
    onSettled: () => { setBusyId(null); void client.invalidateQueries({ queryKey: key }); },
    onError: failure => setError(failure instanceof ApiError && failure.status === 409
      ? "This booking changed. The list has been refreshed." : "Could not update the booking. Check the latest status and try again."),
  });

  if (!nativeConsultancyEnabled()) return <main className="space-y-3"><h1 className="workspace-heading">Consultancy requests</h1>
    <p className="text-sm text-ink-muted">Native consultancy booking is not available yet.</p></main>;

  return <main className="space-y-6">
    <header><h1 className="workspace-heading">Consultancy requests</h1>
      <p className="mt-2 text-sm text-ink-muted">Approve a slot before payment. Refunds inside 48 hours need your review.</p></header>
    {bookings.isPending ? <p role="status" className="text-sm text-ink-muted">Loading requests…</p> : bookings.isError ? (
      <p role="alert" className="text-sm text-danger">Could not load requests. <button type="button" className="underline" onClick={() => void bookings.refetch()}>Try again</button></p>
    ) : <StaffConsultancyQueue bookings={bookings.data} busyId={busyId}
      onApprove={booking => mutation.mutate({ booking, action: "approve" })}
      onDecline={booking => mutation.mutate({ booking, action: "decline" })}
      onRefund={booking => {
        if (window.confirm("Approve a full refund for this booking? Stripe will be asked to return the payment.")) {
          mutation.mutate({ booking, action: "refund" });
        }
      }}
      onDeliver={booking => {
        const summary = window.prompt("Record what was delivered. This stays in the staff record.");
        if (summary?.trim()) mutation.mutate({ booking, action: "delivery", body: { summary: summary.trim() } });
      }} />}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
  </main>;
}
