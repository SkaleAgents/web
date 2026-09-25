"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { advisoryAgreementsEnabled, ApiError, apiFetch, ensureCsrfCookie, type StaffAdvisoryBooking } from "@/lib/api";
import { Button, FieldLabel, TextArea, TextInput } from "@/components/ui";
import { useStaffUserId } from "@/components/staff-access";

export function StaffAdvisoryAgreementOffer({ booking, onRefresh }: { booking: StaffAdvisoryBooking; onRefresh: () => void }) {
  const userId = useStaffUserId();
  const queryClient = useQueryClient();
  const [scope, setScope] = useState(booking.agreement?.scope ?? booking.scope);
  const [estimate, setEstimate] = useState(booking.agreement ? (booking.agreement.quotedFeeCents / 100).toFixed(2) : "");
  const [staleAtVersion, setStaleAtVersion] = useState<number | null>(null);
  const stale = staleAtVersion === booking.version;
  const workStarted = booking.status === "in_progress";
  const submitting = useRef(false);
  const base = `/api/staff/advisory-bookings/${encodeURIComponent(booking.id)}`;
  const offer = useMutation({
    mutationFn: async () => {
      const dollars = Number(estimate);
      const quotedFeeCents = Math.round(dollars * 100);
      if (!scope.trim() || !Number.isSafeInteger(quotedFeeCents) || quotedFeeCents < 0 || Math.abs(dollars * 100 - quotedFeeCents) > 0.000001) {
        throw new Error("Enter a scope and a non-negative estimate with up to two decimal places.");
      }
      await ensureCsrfCookie();
      return apiFetch<StaffAdvisoryBooking>(`${base}/agreement`, {
        method: "PATCH",
        headers: { "If-Match": String(booking.version) },
        body: JSON.stringify({
          scope: scope.trim(),
          quotedFeeCents,
          currency: "USD",
          minimumBillableMinutes: 60,
          incrementMinutes: 15,
          rateCentsPerHour: 25000,
          cancellationTermsVersion: "paid-pilot-v1",
        }),
      });
    },
    onSuccess: (updated) => {
      submitting.current = false;
      queryClient.setQueryData(["staff-bookings", userId, booking.id], updated);
      void queryClient.invalidateQueries({ queryKey: ["staff-bookings", userId] });
    },
    onError: (error) => {
      submitting.current = false;
      if (error instanceof ApiError && error.status === 409) {
        setStaleAtVersion(booking.version);
        void queryClient.invalidateQueries({ queryKey: ["staff-bookings", userId, booking.id], exact: true });
      }
      if (error instanceof ApiError && [401, 403].includes(error.status)) void queryClient.invalidateQueries({ queryKey: ["user"], exact: true });
    },
    onSettled: () => { submitting.current = false; },
  });

  if (!advisoryAgreementsEnabled()) return null;
  return (
    <section aria-label="Offer agreement" className="space-y-4 rounded-xl border border-line bg-canvas-elevated p-5">
      <div>
        <h2 className="text-lg font-semibold">Customer agreement offer</h2>
        <p className="mt-1 text-sm text-ink-muted">Offering revised terms creates a new version and clears the previous acceptance. Accepted versions remain unchanged.</p>
      </div>
      {booking.agreement && <p className="text-sm">Current version: {booking.agreement.version}{booking.agreement.acceptedAt ? " (accepted)" : " (awaiting customer review)"}.</p>}
      {workStarted && <p role="status" className="text-sm text-ink-muted">Work has started. Agreement terms cannot be replaced now. Agree on any scope or price changes before work starts.</p>}
      {stale && <p role="alert" className="text-sm text-danger">The booking changed. Review the refreshed booking before offering terms again.</p>}
      {!workStarted && (
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (!offer.isPending && !submitting.current) { submitting.current = true; offer.mutate(); } }}>
        <label className="block"><FieldLabel>Exact scope</FieldLabel><TextArea required maxLength={10000} value={scope} disabled={offer.isPending} onChange={(event) => setScope(event.target.value)} className="mt-1 min-h-24" /></label>
        <label className="block"><FieldLabel>Written estimate (USD)</FieldLabel><TextInput required type="number" min="0" step="0.01" value={estimate} disabled={offer.isPending} onChange={(event) => setEstimate(event.target.value)} className="mt-1" placeholder="312.50" /></label>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-ink-muted">Rate</dt><dd>$250.00 per hour</dd></div>
          <div><dt className="text-ink-muted">Minimum</dt><dd>60 billable minutes</dd></div>
          <div><dt className="text-ink-muted">Increment</dt><dd>15 minutes after first hour</dd></div>
          <div><dt className="text-ink-muted">Cancellation terms</dt><dd>paid-pilot-v1</dd></div>
        </dl>
        <p className="text-xs text-ink-muted">The estimate is a written quote, not authorization to charge. It is separate from final billing. No payment is collected or confirmed here.</p>
        <Button type="submit" disabled={offer.isPending || stale || !scope.trim() || !estimate}>{offer.isPending ? "Saving offer…" : "Offer new version"}</Button>
        {stale && <Button type="button" variant="secondary" onClick={onRefresh}>Refresh booking</Button>}
        {offer.isSuccess && <p role="status" className="text-sm text-accent">Agreement version {offer.data.agreement?.version} offered. Customer acceptance is still required.</p>}
        {offer.isError && <p role="alert" className="text-sm text-danger">{offer.error instanceof ApiError && offer.error.status === 409 ? "The booking changed. The latest booking has been refreshed; review it before offering again." : offer.error.message}</p>}
      </form>
      )}
    </section>
  );
}
