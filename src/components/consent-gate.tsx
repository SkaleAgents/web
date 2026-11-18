"use client";

import { CookieConsent } from "@/components/cookie-consent";
import { SiteAnalytics } from "@/components/site-analytics";
import { fetchConsentRequired } from "@/lib/cookie-consent";
import { useEffect, useState } from "react";

// Nothing renders, and analytics stays off, until the region is known.
export function ConsentGate() {
  const [required, setRequired] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    fetchConsentRequired().then(value => { if (active) setRequired(value); });
    return () => { active = false; };
  }, []);
  if (required === null) return null;
  return <>
    <CookieConsent required={required} />
    <SiteAnalytics consentRequired={required} />
  </>;
}
