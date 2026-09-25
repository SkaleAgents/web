"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { advisoryAgreementsEnabled, ApiError, apiFetch, ensureCsrfCookie, type AdvisoryBooking } from "@/lib/api";
import { Button } from "@/components/ui";
import { useCustomerUser } from "@/components/customer-booking-access";

export function AdvisoryAgreementReview({ booking, onRefresh }: { booking: AdvisoryBooking; onRefresh: () => void }) {
  const user = useCustomerUser();
  const queryClient = useQueryClient();
  const [confirmedFor, setConfirmedFor] = useState<string | null>(null);
  const [staleAtVersion, setStaleAtVersion] = useState<number | null>(null);
  const [localAcceptance, setLocalAcceptance] = useState<{ agreementVersion: number; acceptedAt: string } | null>(null);
  const submitting = useRef(false);
  const agreement = booking.agreement;
  const currentReviewKey = `${booking.version}:${agreement?.version ?? "none"}`;
  const confirmed = confirmedFor === currentReviewKey;
  const needsFreshReview = staleAtVersion === booking.version;
  const staleNotice = staleAtVersion !== null;
  const acceptedAt = agreement?.acceptedAt ?? (localAcceptance && localAcceptance.agreementVersion === agreement?.version ? localAcceptance.acceptedAt : null);
  const detailKey = ["customer-advisory-booking", user.id, booking.id] as const;

  const accept = useMutation({
    mutationFn: async () => {
      if (!agreement) throw new Error("No agreement is currently offered.");
      await ensureCsrfCookie();
      return apiFetch<AdvisoryBooking>(`/api/advisory-bookings/${encodeURIComponent(booking.id)}/agreement/accept`, {
        method: "POST",
        headers: { "If-Match": String(booking.version) },
        body: JSON.stringify({ agreementVersion: agreement.version }),
      });
    },
    onSuccess: (updated) => {
      submitting.current = false;
      setConfirmedFor(null);
      if (updated.agreement?.acceptedAt) setLocalAcceptance({ agreementVersion: updated.agreement.version, acceptedAt: updated.agreement.acceptedAt });
      queryClient.setQueryData(detailKey, updated);
      void queryClient.invalidateQueries({ queryKey: ["customer-advisory-bookings", user.id] });
    },
    onError: async (error) => {
      submitting.current = false;
      if (error instanceof ApiError && error.status === 409) {
        setConfirmedFor(null);
        setStaleAtVersion(booking.version);
        await queryClient.invalidateQueries({ queryKey: detailKey, exact: true, refetchType: "active" });
      }
      if (error instanceof ApiError && [401, 403].includes(error.status)) void queryClient.invalidateQueries({ queryKey: ["user"], exact: true });
    },
    onSettled: () => { submitting.current = false; },
  });

  if (!advisoryAgreementsEnabled() || !agreement) return null;

  return (
    <section aria-label="Advisory agreement" className="space-y-4 rounded-xl border border-line bg-canvas-elevated p-5">
      <div>
        <h2 className="text-lg font-semibold">Written scope and estimate</h2>
        <p className="mt-1 text-sm text-ink-muted">Offer version {agreement.version}. Review this exact scope and estimate before accepting.</p>
      </div>
      {staleNotice && <p role="alert" className="rounded-lg border border-accent p-3 text-sm">This offer changed before your acceptance was saved. We refreshed the booking. Review the current version and accept it separately if you agree.</p>}
      <div className="space-y-4">
        <div><h3 className="text-sm font-semibold">Scope</h3><p className="mt-1 whitespace-pre-wrap break-words text-sm">{agreement.scope}</p></div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-ink-muted">Written estimate</dt><dd className="mt-1 font-semibold">${(agreement.quotedFeeCents / 100).toFixed(2)} {agreement.currency}</dd></div>
          <div><dt className="text-ink-muted">Rate</dt><dd className="mt-1">${(agreement.rateCentsPerHour / 100).toFixed(2)} per hour</dd></div>
          <div><dt className="text-ink-muted">Minimum</dt><dd className="mt-1">{agreement.minimumBillableMinutes} billable minutes</dd></div>
          <div><dt className="text-ink-muted">After the minimum</dt><dd className="mt-1">Rounded up in {agreement.incrementMinutes}-minute increments</dd></div>
          <div><dt className="text-ink-muted">Cancellation terms</dt><dd className="mt-1">{agreement.cancellationTermsVersion}</dd></div>
          <div><dt className="text-ink-muted">Offered</dt><dd className="mt-1">{new Date(agreement.offeredAt).toLocaleString()}</dd></div>
        </dl>
        <div className="rounded-lg bg-canvas p-4 text-sm">
          <h3 className="font-semibold">Cancellation terms</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-muted">
            <li>Cancel at least 24 hours before the confirmed start for no fee.</li>
            <li>A later customer cancellation may be charged up to one hour only if the expert was available and reserved. Delivered work above one hour may be charged at the actual amount.</li>
            <li>If SkaleAgents cancels or cannot deliver, unstarted work is not charged and any amount collected for it is refunded. Overbilling is corrected in full.</li>
          </ul>
        </div>
      </div>
      {acceptedAt ? (
        <p role="status" className="text-sm font-semibold text-accent">Version {agreement.version} accepted on {new Date(acceptedAt).toLocaleString()}.</p>
      ) : (
        <form className="space-y-3 border-t border-line pt-4" onSubmit={(event) => { event.preventDefault(); if (confirmed && !accept.isPending && !submitting.current) { submitting.current = true; accept.mutate(); } }}>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={confirmed} disabled={accept.isPending || needsFreshReview} onChange={(event) => {
              if (staleNotice && !needsFreshReview) {
                setStaleAtVersion(null);
                accept.reset();
              }
              setConfirmedFor(event.target.checked ? currentReviewKey : null);
            }} />
            <span>I have reviewed and agree to offer version {agreement.version}, including its scope, estimate, and cancellation terms.</span>
          </label>
          <p className="text-xs text-ink-muted">Acceptance records this written agreement. It does not schedule work or authorize a charge. No payment is collected here.</p>
          <Button type="submit" disabled={!confirmed || accept.isPending || needsFreshReview}>{accept.isPending ? "Recording acceptance…" : `Accept version ${agreement.version}`}</Button>
          {accept.isError && !staleNotice && <p role="alert" className="text-sm text-danger">{accept.error.message}</p>}
        </form>
      )}
      <Button type="button" variant="ghost" onClick={onRefresh}>Refresh offer</Button>
    </section>
  );
}
