"use client";

import { optionalCookiesAllowed, subscribeCookieConsent } from "@/lib/cookie-consent";
import { GoogleAnalytics } from "@next/third-parties/google";
import { useSyncExternalStore } from "react";

export function SiteAnalytics({ consentRequired }: { consentRequired: boolean }) {
  const allowed = useSyncExternalStore(subscribeCookieConsent, optionalCookiesAllowed, () => false);
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  // A share link's token is its only credential, and GA would send the full URL.
  if (!measurementId || (consentRequired && !allowed) || location.pathname.startsWith("/reviews/s/")) return null;
  return <GoogleAnalytics gaId={measurementId} />;
}
