import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ConsultancyBookingLink } from "@/components/consultancy-booking-link";

afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

it("links directly to the external booking page without native feature flags or referral data", () => {
  vi.stubEnv("NEXT_PUBLIC_CONSULTANCY_BOOKING_ENABLED", "false");
  render(<ConsultancyBookingLink />);
  const link = screen.getByRole("link", { name: "Book consultancy on harun.dev" });
  expect(link).toHaveAttribute("href", "https://harun.dev/book");
  expect(link).toHaveAttribute("referrerpolicy", "no-referrer");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
