"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { advisoryAgreementsEnabled, advisoryDeliveryHandoffsEnabled, ApiError, apiFetch, ensureCsrfCookie, type AdvisoryDelivery, type StaffAdvisoryBooking } from "@/lib/api";
import { Button, FieldLabel, Select, TextInput } from "@/components/ui";
import { useStaffUserId } from "@/components/staff-access";

type DeliveryInput = Omit<AdvisoryDelivery, "handoffStatus" | "handedOffAt">;

function initialInput(delivery: AdvisoryDelivery | null): DeliveryInput {
  return {
    ownerRef: delivery?.ownerRef ?? "",
    contact: {
      name: delivery?.contact.name ?? "",
      channel: delivery?.contact.channel ?? "email",
      value: delivery?.contact.value ?? "",
    },
  };
}

function matchesDelivery(input: DeliveryInput, delivery: AdvisoryDelivery | null): boolean {
  return Boolean(delivery)
    && input.ownerRef === delivery?.ownerRef
    && input.contact.name === delivery?.contact.name
    && input.contact.channel === delivery?.contact.channel
    && input.contact.value === delivery?.contact.value;
}

export function StaffAdvisoryDelivery({ booking, onRefresh }: { booking: StaffAdvisoryBooking; onRefresh: () => Promise<unknown> }) {
  const userId = useStaffUserId();
  const queryClient = useQueryClient();
  const [input, setInput] = useState(() => initialInput(booking.delivery));
  const [stale, setStale] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const submitting = useRef(false);
  const base = `/api/staff/advisory-bookings/${encodeURIComponent(booking.id)}/delivery`;
  const unchanged = matchesDelivery(input, booking.delivery);
  const workStarted = booking.status === "in_progress";

  const update = useMutation({
    mutationFn: async (contactVerified: boolean) => {
      await ensureCsrfCookie();
      return apiFetch<StaffAdvisoryBooking>(base, {
        method: "PATCH",
        headers: { "If-Match": String(booking.version) },
        body: JSON.stringify({ ...input, contactVerified }),
      });
    },
    onSuccess: (updated) => {
      submitting.current = false;
      setStale(false);
      setRefreshed(false);
      setInput(initialInput(updated.delivery));
      queryClient.setQueryData(["staff-bookings", userId, booking.id], updated);
      void queryClient.invalidateQueries({ queryKey: ["staff-bookings", userId] });
    },
    onError: (error) => {
      submitting.current = false;
      if (error instanceof ApiError && error.status === 409) {
        setStale(true);
        setRefreshed(false);
        void queryClient.invalidateQueries({ queryKey: ["staff-bookings", userId, booking.id], exact: true });
      }
      if (error instanceof ApiError && [401, 403].includes(error.status)) void queryClient.invalidateQueries({ queryKey: ["user"], exact: true });
    },
    onSettled: () => { submitting.current = false; },
  });

  if (!advisoryAgreementsEnabled() || !advisoryDeliveryHandoffsEnabled()) return null;

  const refreshAfterConflict = async () => {
    setRefreshing(true);
    try {
      const result = await onRefresh();
      if (result && typeof result === "object" && "isSuccess" in result && result.isSuccess) setRefreshed(true);
    } finally {
      setRefreshing(false);
    }
  };

  const reviewRefreshedBooking = () => {
    setInput(initialInput(booking.delivery));
    setStale(false);
    setRefreshed(false);
    update.reset();
  };

  const submit = (contactVerified: boolean) => {
    if (submitting.current || update.isPending || stale) return;
    submitting.current = true;
    update.mutate(contactVerified);
  };

  return (
    <section aria-label="Delivery handoff" className="space-y-4 rounded-xl border border-line bg-canvas-elevated p-5">
      <div>
        <h2 className="text-lg font-semibold">Delivery handoff</h2>
        <p className="mt-1 text-sm text-ink-muted">Save the owner and contact details first. Saving never confirms them. After the delivery owner verifies unchanged details, use the separate confirmation action.</p>
      </div>
      {booking.delivery && <p className="text-sm">Handoff status: <strong>{booking.delivery.handoffStatus}</strong>{booking.delivery.handedOffAt ? ` · confirmed ${new Date(booking.delivery.handedOffAt).toLocaleString()}` : ""}</p>}
      {workStarted ? (
        <div className="space-y-3 text-sm text-ink-muted">
          <p role="status">Work has started. Delivery owner, contact, and handoff readiness are locked. Updating them cannot reopen or restart work.</p>
          {booking.delivery && <dl className="grid gap-3 sm:grid-cols-2">
            <div><dt>Delivery owner reference</dt><dd className="mt-1 break-all font-mono text-xs">{booking.delivery.ownerRef}</dd></div>
            <div><dt>Contact name</dt><dd className="mt-1">{booking.delivery.contact.name}</dd></div>
            <div><dt>Contact channel</dt><dd className="mt-1">{booking.delivery.contact.channel}</dd></div>
            <div><dt>Contact detail</dt><dd className="mt-1 break-words">{booking.delivery.contact.value}</dd></div>
          </dl>}
        </div>
      ) : stale ? (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-danger">The booking changed while you were editing. Refresh it, review the current delivery details, then make any needed changes again.</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={refreshing} onClick={() => void refreshAfterConflict()}>{refreshing ? "Refreshing…" : "Refresh booking"}</Button>
            <Button type="button" disabled={!refreshed} onClick={reviewRefreshedBooking}>Review refreshed details</Button>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); submit(false); }}>
          <label className="block"><FieldLabel>Delivery owner reference</FieldLabel><TextInput required maxLength={255} pattern="[A-Za-z0-9][A-Za-z0-9._:\-]*" value={input.ownerRef} disabled={update.isPending} className="mt-1 font-mono text-sm" placeholder="delivery-owner:001" onChange={(event) => setInput({ ...input, ownerRef: event.target.value })} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><FieldLabel>Contact name</FieldLabel><TextInput required maxLength={255} value={input.contact.name} disabled={update.isPending} className="mt-1" onChange={(event) => setInput({ ...input, contact: { ...input.contact, name: event.target.value } })} /></label>
            <label className="block"><FieldLabel>Contact channel</FieldLabel><Select value={input.contact.channel} disabled={update.isPending} className="mt-1" onChange={(event) => setInput({ ...input, contact: { ...input.contact, channel: event.target.value } })}><option value="email">Email</option><option value="phone">Phone</option><option value="other">Other</option></Select></label>
          </div>
          <label className="block"><FieldLabel>Contact detail</FieldLabel><TextInput required maxLength={1000} value={input.contact.value} disabled={update.isPending} className="mt-1" autoComplete="off" onChange={(event) => setInput({ ...input, contact: { ...input.contact, value: event.target.value } })} /></label>
          <p className="text-xs text-ink-muted">Contact details are visible only to this booking&apos;s owner and authorized staff. They are not written to notes or browser storage.</p>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={update.isPending || !input.ownerRef || !input.contact.name || !input.contact.value}>{update.isPending && !unchanged ? "Saving details…" : "Save owner and contact"}</Button>
            <Button type="button" variant="secondary" disabled={update.isPending || !unchanged || booking.delivery?.handoffStatus !== "pending"} onClick={() => submit(true)}>{update.isPending && unchanged ? "Confirming…" : "Confirm verified unchanged details"}</Button>
          </div>
          {update.isSuccess && <p role="status" className="text-sm text-accent">{update.data.delivery?.handoffStatus === "ready" ? "Delivery handoff confirmed." : "Details saved as pending. Verify them with the owner, then use the separate confirmation action."}</p>}
          {update.isError && <p role="alert" className="text-sm text-danger">{update.error instanceof ApiError && update.error.status === 409 ? "The booking changed. Refresh and review the latest details before continuing." : "Could not update the delivery handoff. Review the details and try again."}</p>}
        </form>
      )}
    </section>
  );
}
