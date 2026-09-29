"use client";

import { useState } from "react";
import type { ConsultancyPackage } from "@/lib/api";
import { Button, FieldLabel, Select, TextArea, TextInput } from "@/components/ui";

export type ConsultancyRequestInput = {
  package: ConsultancyPackage["slug"];
  startAt: string;
  scope: string;
  notes: string | null;
};

function slotLabel(slot: string, timezone: string): string {
  try {
    return new Date(slot).toLocaleString("en-US", {
      timeZone: timezone, month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", timeZoneName: "short",
    });
  } catch {
    return slot;
  }
}

export function ConsultancyBookingForm({
  packages, slots, timezone, availabilityState, selectedPackage = "light", pending,
  onPackageChange, onTimezoneChange, onSubmit,
}: {
  packages: ConsultancyPackage[];
  slots: string[];
  timezone: string;
  availabilityState: "loading" | "ready" | "unavailable";
  selectedPackage?: ConsultancyPackage["slug"];
  pending: boolean;
  onPackageChange: (value: ConsultancyPackage["slug"]) => void;
  onTimezoneChange: (value: string) => void;
  onSubmit: (input: ConsultancyRequestInput) => void;
}) {
  const [startAt, setStartAt] = useState("");
  const [scope, setScope] = useState("");
  const [notes, setNotes] = useState("");
  const canSubmit = availabilityState === "ready" && slots.includes(startAt) && scope.trim().length > 0 && !pending;

  return <form className="space-y-7" onSubmit={event => {
    event.preventDefault();
    if (canSubmit) onSubmit({ package: selectedPackage, startAt, scope: scope.trim(), notes: notes.trim() || null });
  }}>
    <fieldset className="space-y-3">
      <legend className="text-lg font-semibold text-ink">Choose the work</legend>
      <div className="grid gap-3 lg:grid-cols-3">
        {packages.map(item => <label key={item.slug} className={`block cursor-pointer rounded-[10px] border p-4 ${selectedPackage === item.slug ? "border-accent bg-accent-soft" : "border-line bg-canvas-elevated"}`}>
          <input type="radio" name="consultancy-package" value={item.slug} checked={selectedPackage === item.slug}
            onChange={() => { setStartAt(""); onPackageChange(item.slug); }} className="sr-only" />
          <span className="block text-lg font-semibold text-ink">{item.name} · ${(item.priceCents / 100).toFixed(0)}</span>
          <span className="mt-1 block text-sm text-ink-muted">{item.durationMinutes} minutes</span>
          <span className="mt-3 block text-sm text-ink-muted">{item.features.join(", ")}</span>
        </label>)}
      </div>
    </fieldset>

    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <label>
        <FieldLabel>Time zone</FieldLabel>
        <TextInput className="mt-1" value={timezone} onChange={event => { setStartAt(""); onTimezoneChange(event.target.value); }}
          placeholder="Asia/Dhaka" autoComplete="off" />
      </label>
      <label>
        <FieldLabel>Available time in {timezone}</FieldLabel>
        <Select className="mt-1" value={startAt} disabled={availabilityState !== "ready"}
          onChange={event => setStartAt(event.target.value)}>
          <option value="">Choose a time</option>
          {slots.map(slot => <option value={slot} key={slot}>
            {slotLabel(slot, timezone)}
          </option>)}
        </Select>
      </label>
    </div>
    {availabilityState === "loading" && <p role="status" className="text-sm text-ink-muted">Checking available times…</p>}
    {availabilityState === "unavailable" && <p role="alert" className="text-sm text-danger">Availability is temporarily unavailable. Try again shortly.</p>}
    {availabilityState === "ready" && slots.length === 0 && <p className="text-sm text-ink-muted">No open times in the next 28 days. Try another package.</p>}

    <label className="block">
      <FieldLabel>What should Harun review?</FieldLabel>
      <TextArea className="mt-1 min-h-28 font-sans" required maxLength={10000} value={scope}
        onChange={event => setScope(event.target.value)} placeholder="For example: review an ingress rule and suggest safer access." />
    </label>
    <label className="block">
      <FieldLabel>Anything else? (optional)</FieldLabel>
      <TextArea className="mt-1 min-h-20 font-sans" maxLength={10000} value={notes}
        onChange={event => setNotes(event.target.value)} />
    </label>
    <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
      <Button type="submit" disabled={!canSubmit}>{pending ? "Sending request…" : "Request this time"}</Button>
      <p className="text-sm text-ink-muted">Payment comes after approval. You can review the price and time first.</p>
    </div>
  </form>;
}
