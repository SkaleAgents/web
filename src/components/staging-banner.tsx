// Dashboard only: the public site and sign-in pages stay clean. Read at render so tests can stub it; Next inlines NEXT_PUBLIC_* at build time.
export function isStaging(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === "staging";
}

export function StagingBanner() {
  if (!isStaging()) return null;
  return (
    <div role="status" className="staging-banner">
      <span className="hidden sm:inline">Staging environment: payments run in Stripe test mode and no real money moves.</span>
      <span className="sm:hidden">Staging: Stripe test mode, no real money.</span>
    </div>
  );
}
