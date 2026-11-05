// Dashboard only: the public site and sign-in pages stay clean. Read at render so tests can stub it; Next inlines NEXT_PUBLIC_* at build time.
export function StagingBanner() {
  if (process.env.NEXT_PUBLIC_APP_ENV !== "staging") return null;
  return (
    <div role="status" className="border-b border-line bg-accent-soft px-4 py-2 text-center text-xs font-semibold text-ink">
      Staging environment: payments run in Stripe test mode and no real money moves.
    </div>
  );
}
