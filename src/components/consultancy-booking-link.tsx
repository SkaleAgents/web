import { CONSULTANCY_BOOKING_URL } from "@/lib/consultancy-link";

export function ConsultancyBookingLink() {
  return <a href={CONSULTANCY_BOOKING_URL} referrerPolicy="no-referrer" rel="noreferrer"
    className="inline-flex rounded-[10px] border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent">
    Book consultancy on harun.dev
  </a>;
}
