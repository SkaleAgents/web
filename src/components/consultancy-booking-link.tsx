import Link from "next/link";
import { nativeConsultancyEnabled, type PortfolioBookingReferralSource } from "@/lib/api";

export function ConsultancyBookingLink({ source }: { source?: PortfolioBookingReferralSource }) {
  if (!nativeConsultancyEnabled()) {
    return <p className="text-sm text-ink-muted">Consultancy booking is not available yet.</p>;
  }

  const query = source ? `?sourceType=${encodeURIComponent(source.type)}&sourceId=${encodeURIComponent(source.id)}` : "";
  return <div className="space-y-2 text-sm">
    <Link href={`/me/consultancy${query}`}
      className="inline-flex rounded-[10px] border border-line px-3 py-2 font-semibold text-ink hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent">
      Book a consultancy session
    </Link>
    <p className="text-ink-muted">Choose a package and request a time. Payment opens only after Harun approves it.</p>
  </div>;
}
