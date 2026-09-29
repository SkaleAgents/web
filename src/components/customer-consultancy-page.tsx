"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError, nativeConsultancyEnabled, type ConsultancyBooking, type ConsultancyPackage } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { ConsultancyBookingForm, type ConsultancyRequestInput } from "@/components/consultancy-booking-form";
import { ConsultancyBookingDetail } from "@/components/consultancy-booking-detail";
import { Button } from "@/components/ui";

type Source = { type: "audit_job" | "advisory_booking"; id: string };

function unavailable() {
  return <main className="space-y-3"><h1 className="workspace-heading">Consultancy</h1>
    <p className="text-sm text-ink-muted">Consultancy booking is not available yet.</p></main>;
}

export function CustomerConsultancyPage({ source }: { source?: Source }) {
  const router = useRouter();
  const client = useQueryClient();
  const user = useQuery(currentUserOptions);
  const [packageSlug, setPackageSlug] = useState<ConsultancyPackage["slug"]>("light");
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [refreshKey, setRefreshKey] = useState(0);
  const requestKey = useRef<{ payload: string; key: string } | null>(null);
  const accountId = user.data?.id;
  const packages = useQuery({
    queryKey: ["consultancy-packages"], enabled: nativeConsultancyEnabled() && Boolean(accountId),
    queryFn: async ({ signal }) => (await apiFetch<{ packages: ConsultancyPackage[] }>("/api/consultancy/packages", { signal })).packages,
  });
  const slots = useQuery({
    queryKey: ["consultancy-availability", accountId, packageSlug, timezone, refreshKey],
    enabled: nativeConsultancyEnabled() && Boolean(accountId) && Boolean(timezone), retry: false,
    queryFn: async ({ signal }) => (await apiFetch<{ slots: string[] }>(
      `/api/consultancy/availability?package=${encodeURIComponent(packageSlug)}&timezone=${encodeURIComponent(timezone)}`, { signal })).slots,
  });
  const bookings = useQuery({
    queryKey: ["consultancy-bookings", accountId], enabled: nativeConsultancyEnabled() && Boolean(accountId), retry: false,
    queryFn: async ({ signal }) => (await apiFetch<{ bookings: ConsultancyBooking[] }>("/api/consultancy/bookings", { signal })).bookings,
  });
  const request = useMutation({
    mutationFn: async (input: ConsultancyRequestInput) => {
      const payload = JSON.stringify({ ...input, ...(source ? { source } : {}) });
      if (requestKey.current?.payload !== payload) requestKey.current = { payload, key: crypto.randomUUID() };
      return apiFetch<ConsultancyBooking>("/api/consultancy/bookings", {
        method: "POST", headers: { "Idempotency-Key": requestKey.current.key }, body: payload,
      });
    },
    onSuccess: booking => {
      requestKey.current = null;
      void client.invalidateQueries({ queryKey: ["consultancy-bookings", accountId] });
      router.push(`/me/consultancy/${booking.id}`);
    },
  });

  if (!nativeConsultancyEnabled()) return unavailable();
  if (!accountId) return <p role="status" className="text-sm text-ink-muted">Checking your account…</p>;

  return <main className="space-y-9">
    <header className="max-w-3xl space-y-2">
      <h1 className="workspace-heading">Consultancy with Harun</h1>
      <p className="text-ink-muted">Pick the work and a time. Harun reviews the request before you pay.</p>
    </header>
    <section className="space-y-5" aria-labelledby="request-heading">
      <div className="flex items-end justify-between gap-3">
        <h2 id="request-heading" className="text-xl font-semibold text-ink">Request a session</h2>
        <Button type="button" variant="ghost" onClick={() => setRefreshKey(value => value + 1)}>Refresh times</Button>
      </div>
      {source && <p className="text-sm text-ink-muted">This request can be linked to your selected {source.type === "audit_job" ? "audit" : "advisory request"}. No report content is copied.</p>}
      {packages.isPending ? <p role="status" className="text-sm text-ink-muted">Loading packages…</p> : packages.isError ? (
        <p role="alert" className="text-sm text-danger">Could not load packages. <button type="button" className="underline" onClick={() => void packages.refetch()}>Try again</button></p>
      ) : <ConsultancyBookingForm packages={packages.data} slots={slots.data ?? []} timezone={timezone}
        selectedPackage={packageSlug} availabilityState={slots.isError ? "unavailable" : slots.isPending ? "loading" : "ready"}
        pending={request.isPending} onPackageChange={setPackageSlug} onTimezoneChange={setTimezone}
        onSubmit={input => request.mutate(input)} />}
      {request.isError && <p role="alert" className="text-sm text-danger">{request.error instanceof ApiError && request.error.status === 409
        ? "This request changed. Choose a new time and try again." : "Could not send the request. Check your booking list before retrying."}</p>}
    </section>
    <section className="space-y-4 border-t border-line pt-7" aria-labelledby="your-bookings-heading">
      <h2 id="your-bookings-heading" className="text-xl font-semibold text-ink">Your bookings</h2>
      {bookings.isPending ? <p role="status" className="text-sm text-ink-muted">Loading bookings…</p> : bookings.isError ? (
        <p role="alert" className="text-sm text-danger">Could not load your bookings. <button type="button" className="underline" onClick={() => void bookings.refetch()}>Try again</button></p>
      ) : bookings.data.length === 0 ? <p className="text-sm text-ink-muted">No requests yet.</p> : (
        <ul className="divide-y divide-line">{bookings.data.map(booking => <li key={booking.id} className="py-4">
          <Link className="flex flex-wrap justify-between gap-2 font-medium text-ink hover:text-accent" href={`/me/consultancy/${booking.id}`}>
            <span>{booking.package.name} · {new Date(booking.requestedWindow.startAt).toLocaleString()}</span>
            <span className="text-sm text-ink-muted">{booking.status.replaceAll("_", " ")}</span>
          </Link>
        </li>)}</ul>
      )}
    </section>
  </main>;
}

export function CustomerConsultancyDetailPage({ id, checkoutReturned = false }: { id: string; checkoutReturned?: boolean }) {
  const user = useQuery(currentUserOptions);
  const accountId = user.data?.id;
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const client = useQueryClient();
  const key = useMemo(() => ["consultancy-booking", accountId, id], [accountId, id]);
  const booking = useQuery({
    queryKey: key, enabled: nativeConsultancyEnabled() && Boolean(accountId), retry: false,
    queryFn: ({ signal }) => apiFetch<ConsultancyBooking>(`/api/consultancy/bookings/${id}`, { signal }),
    refetchInterval: checkoutReturned ? 10_000 : false,
  });
  const action = useMutation({
    mutationFn: ({ path, version, body }: { path: string; version: number; body?: object }) =>
      apiFetch<ConsultancyBooking | { checkoutUrl: string }>(`/api/consultancy/bookings/${id}/${path}`, {
        method: "POST", headers: { "If-Match": String(version) }, body: body ? JSON.stringify(body) : undefined,
      }),
    onSuccess: (result, variables) => {
      setError(null);
      if (variables.path === "checkout" && "checkoutUrl" in result) {
        window.location.assign(result.checkoutUrl);
      } else {
        void client.invalidateQueries({ queryKey: key });
        if (variables.path === "cancel") router.refresh();
      }
    },
    onError: failure => {
      setError(failure instanceof ApiError && failure.status === 409
        ? "This booking changed. Refresh the latest details before trying again."
        : "Could not update the booking. Try again after checking its current status.");
      void client.invalidateQueries({ queryKey: key });
    },
  });

  if (!nativeConsultancyEnabled()) return unavailable();
  if (!accountId || booking.isPending) return <p role="status" className="text-sm text-ink-muted">Loading booking…</p>;
  if (booking.isError) return <main className="space-y-3"><h1 className="workspace-heading">Booking unavailable</h1>
    <p role="alert" className="text-sm text-ink-muted">This booking could not be opened from your account.</p>
    <Link href="/me/consultancy" className="text-accent underline">Back to consultancy</Link></main>;

  return <main className="max-w-3xl space-y-6">
    <Link href="/me/consultancy" className="text-sm text-accent underline">All consultancy bookings</Link>
    <ConsultancyBookingDetail booking={booking.data} checkoutReturned={checkoutReturned} busy={action.isPending}
      onPay={() => action.mutate({ path: "checkout", version: booking.data.version })}
      onCancel={() => {
        if (window.confirm("Cancel this booking? A full refund applies at least 48 hours before the call. Later cancellations go to review.")) {
          action.mutate({ path: "cancel", version: booking.data.version });
        }
      }}
      onAcceptSlot={() => booking.data.proposedWindow && action.mutate({
        path: "accept-slot", version: booking.data.version, body: { startAt: booking.data.proposedWindow.startAt },
      })} />
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
  </main>;
}
