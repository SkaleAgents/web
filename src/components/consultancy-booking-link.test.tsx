import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConsultancyBookingLink } from "@/components/consultancy-booking-link";

afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

describe("native consultancy entry", () => {
  it("keeps booking unavailable while the native rollout flag is off", () => {
    render(<ConsultancyBookingLink />);
    expect(screen.getByText("Consultancy booking is not available yet.")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Book a consultancy session" })).not.toBeInTheDocument();
  });

  it("opens the dashboard form with only an optional owned source reference", () => {
    vi.stubEnv("NEXT_PUBLIC_CONSULTANCY_BOOKING_ENABLED", "true");
    render(<ConsultancyBookingLink source={{ type: "audit_job", id: "private-job-id" }} />);
    expect(screen.getByRole("link", { name: "Book a consultancy session" }))
      .toHaveAttribute("href", "/dashboard/consultancy?sourceType=audit_job&sourceId=private-job-id");
    expect(screen.getByText(/Payment opens only after Harun approves it/)).toBeVisible();
  });
});
