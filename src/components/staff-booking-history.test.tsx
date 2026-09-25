import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AdvisoryBookingHistoryEntry } from "@/lib/api";
import { HistoryDescription } from "@/components/staff-booking-detail";

describe("staff booking history descriptions", () => {
  it("renders delivery history without exposing contact values", () => {
    const entry: AdvisoryBookingHistoryEntry = {
      id: "event-1",
      type: "delivery",
      actorRef: "staff-1",
      fromStatus: null,
      toStatus: null,
      assigneeRef: null,
      billing: { billableMinutes: null, feeCents: null, currency: null },
      changedFields: ["ownerRef", "contact"],
      createdAt: "2026-09-25T18:30:00Z",
    };

    render(<HistoryDescription entry={entry} />);

    expect(screen.getByText("Delivery handoff updated (ownerRef, contact)")).toBeTruthy();
    expect(screen.queryByText(/@/)).toBeNull();
  });
});
