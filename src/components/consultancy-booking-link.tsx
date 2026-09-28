"use client";

import { useState } from "react";
import { apiFetch, portfolioBookingHandoffEnabled, type PortfolioBookingReferralSource } from "@/lib/api";

const BOOK_URL = "https://harun.dev/book";
const linkClassName = "inline-flex rounded-[10px] border border-line px-3 py-2 font-semibold text-ink hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent";

function validBookUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.origin === "https://harun.dev" && url.pathname === "/book"
      && /^[A-Za-z0-9_-]{32}$/.test(url.searchParams.get("sa_ref") ?? "")
      && Array.from(url.searchParams.keys()).length === 1;
  } catch {
    return false;
  }
}

export function ConsultancyBookingLink({ source }: { source?: PortfolioBookingReferralSource }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparedUrl, setPreparedUrl] = useState<string | null>(null);
  const enabled = portfolioBookingHandoffEnabled();

  async function prepareBooking() {
    setPending(true);
    setError(null);
    setPreparedUrl(null);
    const opened = window.open("", "_blank");
    if (opened) {
      opened.opener = null;
      const policy = opened.document.createElement("meta");
      policy.name = "referrer";
      policy.content = "no-referrer";
      opened.document.head.append(policy);
    }

    try {
      const referral = await apiFetch<{ bookUrl: string }>("/api/portfolio-booking-referrals", {
        method: "POST",
        body: JSON.stringify({ source }),
      });
      if (!validBookUrl(referral.bookUrl)) throw new Error("Invalid booking link");
      if (opened) opened.location.assign(referral.bookUrl);
      else setPreparedUrl(referral.bookUrl);
    } catch {
      opened?.close();
      setError("Could not prepare the booking link. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2 text-sm">
      {enabled ? (
        <button type="button" className={linkClassName} onClick={() => void prepareBooking()} disabled={pending}>
          {pending ? "Preparing booking…" : "Book a consultancy session"}
        </button>
      ) : (
        <a href={BOOK_URL} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className={linkClassName}>
          Book a consultancy session
        </a>
      )}
      {preparedUrl && <p><a href={preparedUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="font-semibold text-accent underline">Open prepared booking link</a></p>}
      {error && <p role="alert" className="text-danger">{error}</p>}
      <p className="text-xs text-ink-muted">harun.dev/book (opens in a new tab)</p>
      <p className="max-w-xl text-ink-muted">See current prices and request a time with Harun. Payment is available after Harun approves your request.</p>
    </div>
  );
}
