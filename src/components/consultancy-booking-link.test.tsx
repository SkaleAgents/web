import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AdvisoryBookingRequest } from "@/components/advisory-booking-request";
import { ConsultancyBookingLink } from "@/components/consultancy-booking-link";

afterEach(cleanup);

describe("consultancy booking handoff", () => {
  it("links to the approved booking page without sending private context or a referrer", () => {
    render(<ConsultancyBookingLink />);

    const link = screen.getByRole("link", { name: "Book a consultancy session" });
    expect(link).toHaveAttribute("href", "https://harun.dev/book");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(screen.getByText(/harun\.dev\/book/)).toBeVisible();
    expect(screen.getByText(/current prices/)).toBeVisible();
    expect(screen.getByText(/Payment is available after Harun approves your request/)).toBeVisible();
  });

  it.each(["audit_job", "watchtower_session"] as const)("preserves the existing %s request form beside the external handoff", (type) => {
    const client = new QueryClient();
    render(<QueryClientProvider client={client}><AdvisoryBookingRequest source={{ type, id: "private-source-reference" }} /></QueryClientProvider>);

    expect(screen.getByRole("link", { name: "Book a consultancy session" })).toHaveAttribute("href", "https://harun.dev/book");
    fireEvent.click(screen.getByRole("button", { name: "Request expert help" }));
    expect(screen.getByRole("heading", { name: "Request an expert" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Send request" })).toBeVisible();
  });
});
