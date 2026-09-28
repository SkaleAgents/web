import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdvisoryBookingRequest } from "@/components/advisory-booking-request";
import { ConsultancyBookingLink } from "@/components/consultancy-booking-link";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

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

  it("creates an opaque referral before opening the portfolio for a personal audit", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTFOLIO_BOOKING_HANDOFF_ENABLED", "true");
    const fetcher = vi.fn(async () => Response.json({
      id: "referral-1",
      bookUrl: "https://harun.dev/book?sa_ref=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      expiresAt: "2026-10-06T00:00:00Z",
    }));
    vi.stubGlobal("fetch", fetcher);
    const opened = {
      opener: window,
      document: document.implementation.createHTMLDocument(""),
      location: { assign: vi.fn() },
      close: vi.fn(),
    };
    vi.spyOn(window, "open").mockReturnValue(opened as unknown as Window);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<ConsultancyBookingLink source={{ type: "audit_job", id: "private-job-id" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Book a consultancy session" }));

    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(opened.document.body.querySelector("a")?.href).toBe("https://harun.dev/book?sa_ref=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    expect(opened.document.body.querySelector("a")?.rel).toBe("noreferrer");
    expect(opened.opener).toBeNull();
    expect(opened.document.querySelector('meta[name="referrer"]')?.getAttribute("content")).toBe("no-referrer");
    expect(fetcher).toHaveBeenCalledWith(expect.stringMatching(/\/api\/portfolio-booking-referrals$/), expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ source: { type: "audit_job", id: "private-job-id" } }),
    }));
    expect(opened.close).not.toHaveBeenCalled();
  });

  it("closes the blank tab and offers retry when referral creation fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTFOLIO_BOOKING_HANDOFF_ENABLED", "true");
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "Unavailable" }, { status: 503 })));
    const opened = { opener: window, document: document.implementation.createHTMLDocument(""), location: { assign: vi.fn() }, close: vi.fn() };
    vi.spyOn(window, "open").mockReturnValue(opened as unknown as Window);

    render(<ConsultancyBookingLink />);
    fireEvent.click(screen.getByRole("button", { name: "Book a consultancy session" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not prepare the booking link. Try again.");
    expect(opened.close).toHaveBeenCalled();
    expect(opened.location.assign).not.toHaveBeenCalled();
  });

  it("offers a no-referrer link when the browser blocks the new tab", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTFOLIO_BOOKING_HANDOFF_ENABLED", "true");
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({
      bookUrl: "https://harun.dev/book?sa_ref=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    })));
    vi.spyOn(window, "open").mockReturnValue(null);

    render(<ConsultancyBookingLink />);
    fireEvent.click(screen.getByRole("button", { name: "Book a consultancy session" }));

    const link = await screen.findByRole("link", { name: "Open prepared booking link" });
    expect(link).toHaveAttribute("href", "https://harun.dev/book?sa_ref=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("referrerpolicy", "no-referrer");
  });
});
