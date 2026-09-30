"use client";

import { loadStripe } from "@stripe/stripe-js/pure";
import type { StripeEmbeddedCheckout } from "@stripe/stripe-js";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Button } from "@/components/ui";

export function EmbeddedStripeCheckout({ clientSecret, publishableKey, onComplete }: {
  clientSecret: string;
  publishableKey: string;
  onComplete: () => void;
}) {
  const complete = useEffectEvent(onComplete);
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let disposed = false;
    let checkout: StripeEmbeddedCheckout | undefined;
    async function mount() {
      try {
        const stripe = await loadStripe(publishableKey);
        if (disposed) return;
        if (!stripe) throw new Error("Stripe unavailable");
        const initialized = await stripe.createEmbeddedCheckoutPage({ clientSecret, onComplete: () => { if (!disposed) complete(); } });
        if (disposed) { initialized.destroy(); return; }
        checkout = initialized;
        if (container.current) initialized.mount(container.current);
        setReady(true);
      } catch {
        if (!disposed) setFailed(true);
      }
    }
    void mount();
    return () => { disposed = true; checkout?.destroy(); };
  }, [clientSecret, publishableKey, attempt]);

  return <section aria-label="Secure payment" className="space-y-3">
    {!ready && !failed ? <p role="status" className="text-sm text-ink-muted">Loading secure payment form…</p> : null}
    {failed ? <div>
      <p role="alert" className="text-sm text-danger">Unable to load the payment form. Try again.</p>
      <Button type="button" variant="secondary" onClick={() => { setFailed(false); setReady(false); setAttempt(value => value + 1); }}>Retry payment form</Button>
    </div> : null}
    <div ref={container} />
  </section>;
}
