export function ConsultancyBookingLink() {
  return (
    <div className="space-y-2 text-sm">
      <a
        href="https://harun.dev/book"
        target="_blank"
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
        className="inline-flex rounded-[10px] border border-line px-3 py-2 font-semibold text-ink hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent"
      >
        Book a consultancy session
      </a>
      <p className="text-xs text-ink-muted">harun.dev/book (opens in a new tab)</p>
      <p className="max-w-xl text-ink-muted">See current prices and request a time with Harun. Payment is available after Harun approves your request.</p>
    </div>
  );
}
