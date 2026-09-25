import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdvisoryBooking } from "@/lib/api";
import { availableBookingTransitions } from "@/lib/advisory-bookings";

const accepted: AdvisoryBooking = {
  id: "booking-a",
  version: 8,
  source: { type: "audit_job", id: "job-a" },
  status: "accepted",
  assigneeRef: "expert:42",
  scope: "Review rollback plan",
  urgency: "soon",
  preferredWindow: { startAt: "2026-09-28T16:00:00Z", endAt: "2026-09-28T17:00:00Z" },
  notes: null,
  billing: { billableMinutes: null, feeCents: null, currency: "USD" },
  agreement: { id: "agreement-a", version: 2, scope: "Review rollback plan", currency: "USD", quotedFeeCents: 25000, minimumBillableMinutes: 60, incrementMinutes: 15, rateCentsPerHour: 25000, cancellationTermsVersion: "paid-pilot-v1", offeredAt: "2026-09-25T16:00:00Z", acceptedAt: null },
  appointment: null,
  delivery: null,
  createdAt: "2026-09-25T15:00:00Z",
  updatedAt: "2026-09-25T16:00:00Z",
};

afterEach(() => vi.unstubAllEnvs());

describe("advisory booking transitions", () => {
  it("requires current agreement acceptance and a confirmed appointment to schedule", () => {
    vi.stubEnv("NEXT_PUBLIC_ADVISORY_AGREEMENTS_ENABLED", "true");
    expect(availableBookingTransitions(accepted)).not.toContain("scheduled");
    const confirmedAppointment = {
      confirmedWindow: { startAt: "2026-09-29T16:00:00Z", endAt: "2026-09-29T17:00:00Z", timezone: "UTC" },
      confirmedAt: "2026-09-25T18:00:00Z",
    };
    expect(availableBookingTransitions({ ...accepted, appointment: confirmedAppointment })).not.toContain("scheduled");
    expect(availableBookingTransitions({ ...accepted, appointment: confirmedAppointment, agreement: { ...accepted.agreement!, acceptedAt: "2026-09-25T16:10:00Z" } })).toContain("scheduled");
  });

  it("keeps paid-pilot work start blocked until delivery handoff is available, and preserves legacy flow when disabled", () => {
    vi.stubEnv("NEXT_PUBLIC_ADVISORY_AGREEMENTS_ENABLED", "true");
    const scheduled = { ...accepted, status: "scheduled" as const, appointment: { confirmedWindow: { startAt: "2026-09-29T16:00:00Z", endAt: "2026-09-29T17:00:00Z", timezone: "UTC" }, confirmedAt: "2026-09-25T18:00:00Z" }, agreement: { ...accepted.agreement!, acceptedAt: "2026-09-25T16:10:00Z" } };
    expect(availableBookingTransitions(scheduled)).not.toContain("in_progress");
    vi.stubEnv("NEXT_PUBLIC_ADVISORY_DELIVERY_HANDOFFS_ENABLED", "true");
    expect(availableBookingTransitions({ ...scheduled, delivery: { ownerRef: "delivery-owner:1", contact: { name: "Test Owner", channel: "email", value: "owner@example.test" }, handoffStatus: "pending", handedOffAt: null } })).not.toContain("in_progress");
    expect(availableBookingTransitions({ ...scheduled, delivery: { ownerRef: "delivery-owner:1", contact: { name: "Test Owner", channel: "email", value: "owner@example.test" }, handoffStatus: "ready", handedOffAt: "2026-09-25T18:30:00Z" } })).toContain("in_progress");
    vi.stubEnv("NEXT_PUBLIC_ADVISORY_DELIVERY_HANDOFFS_ENABLED", "false");
    expect(availableBookingTransitions({ ...scheduled, delivery: { ownerRef: "delivery-owner:1", contact: { name: "Test Owner", channel: "email", value: "owner@example.test" }, handoffStatus: "ready", handedOffAt: "2026-09-25T18:30:00Z" } })).not.toContain("in_progress");
    vi.stubEnv("NEXT_PUBLIC_ADVISORY_AGREEMENTS_ENABLED", "false");
    expect(availableBookingTransitions(scheduled)).toContain("in_progress");
  });
});
