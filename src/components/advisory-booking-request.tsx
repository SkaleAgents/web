"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch, type AdvisoryBooking, type AdvisoryBookingSourceType } from "@/lib/api";
import { Button, FieldLabel, Select, TextArea, TextInput } from "@/components/ui";
import { ConsultancyBookingLink } from "@/components/consultancy-booking-link";

export function AdvisoryBookingRequest({
  source,
}: {
  source: { type: AdvisoryBookingSourceType; id: string };
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState("");
  const [urgency, setUrgency] = useState<"routine" | "soon" | "urgent" | "emergency">("urgent");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState<AdvisoryBooking | null>(null);
  const request = useMutation({
    mutationFn: () => apiFetch<AdvisoryBooking>("/api/advisory-bookings", {
      method: "POST",
      body: JSON.stringify({
        source,
        scope,
        urgency,
        preferredWindow: {
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
        },
        notes: notes || null,
      }),
    }),
    onSuccess: (booking) => setSubmitted(booking),
  });

  if (!open) {
    return (
      <div className="space-y-4">
        <ConsultancyBookingLink />
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          Request expert help
        </Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-[10px] border border-accent bg-accent-soft p-4 text-sm text-ink">
        <p className="font-semibold">Expert request sent</p>
        <p className="mt-1 text-ink-muted">We&apos;ll review the scope and preferred window.</p>
      </div>
    );
  }

  return (
    <section className="w-full rounded-[10px] border border-line bg-canvas-elevated p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Request an expert</h2>
          <p className="mt-1 text-sm text-ink-muted">Tell a senior engineer what needs attention.</p>
        </div>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Close</Button>
      </div>
      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          request.mutate();
        }}
      >
        <label>
          <FieldLabel>Scope</FieldLabel>
          <TextArea
            required
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            className="mt-1 min-h-24"
            placeholder="Describe the incident, migration, or risk you need help with."
          />
        </label>
        <div className="grid gap-4 md:grid-cols-3">
          <label>
            <FieldLabel>Urgency</FieldLabel>
            <Select value={urgency} onChange={(event) => setUrgency(event.target.value as typeof urgency)} className="mt-1">
              <option value="routine">Routine</option>
              <option value="soon">Soon</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </Select>
          </label>
          <label>
            <FieldLabel>Preferred start</FieldLabel>
            <TextInput required type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} className="mt-1" />
          </label>
          <label>
            <FieldLabel>Preferred end</FieldLabel>
            <TextInput required type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} className="mt-1" />
          </label>
        </div>
        <label>
          <FieldLabel>Notes (optional)</FieldLabel>
          <TextArea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 min-h-20" placeholder="Add context for the expert." />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={request.isPending}>
            {request.isPending ? "Sending…" : "Send request"}
          </Button>
          {request.isError && <p className="text-sm text-danger">{request.error.message}</p>}
        </div>
      </form>
    </section>
  );
}
