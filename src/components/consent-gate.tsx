"use client";

import { CookieConsent } from "@/components/cookie-consent";
import { SiteAnalytics } from "@/components/site-analytics";
import { useEffect, useState } from "react";

// Nothing renders, and analytics stays off, until the region is known.
export function ConsentGate() {
  const [required, setRequired] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/consent-region", { cache: "no-store" })
      .then(response => response.ok ? response.json() as Promise<{ required?: unknown }> : { required: false })
      .then(body => { if (active) setRequired(body.required === true); })
      .catch(() => { if (active) setRequired(false); });
    return () => { active = false; };
  }, []);
  if (required === null) return null;
  return <>
    <CookieConsent required={required} />
    <SiteAnalytics consentRequired={required} />
  </>;
}
