"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { apiFetch, ensureCsrfCookie } from "@/lib/api";
import { planBlurbs } from "@/lib/plan-blurbs";
import { Turnstile, turnstileEnabled } from "./turnstile";

type Plan = {
  key: string;
  name: string;
  monthlyUsd: number | null;
  auditLimit: number | null;
  scheduleLimit: number | null;
  minimumIntervalHours: number | null;
  recommended: boolean;
  checkoutMode: "included" | "self_service" | "contact";
};

type PlanCatalog = { data: Plan[]; enrollmentOpen?: boolean };

export function PricingPlans() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const [catalogError, setCatalogError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [challenge, setChallenge] = useState(0);
  const verifying = turnstileEnabled && !turnstileToken;

  useEffect(() => {
    let active = true;
    apiFetch<PlanCatalog>("/api/organization-plans", { credentials: "omit" })
      .then((result) => { if (active) { setPlans(result.data); setEnrollmentOpen(result.enrollmentOpen === true); } })
      .catch(() => { if (active) setCatalogError(true); });
    return () => { active = false; };
  }, []);

  async function sendInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || verifying) return;
    setSubmitting(true);
    setSubmitError(false);
    const form = new FormData(event.currentTarget);
    try {
      await ensureCsrfCookie();
      const response = await apiFetch<{ id: string; status: string }>("/api/enterprise-inquiries", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          organizationName: form.get("organizationName"),
          contactName: form.get("contactName"),
          email: form.get("email"),
          requirements: form.get("requirements") || null,
          ...(turnstileToken ? { turnstileToken } : {}),
        }),
      });
      if (response.status !== "received" || !response.id) throw new Error("Unexpected inquiry response");
      setSubmitted(true);
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
      setTurnstileToken("");
      setChallenge((value) => value + 1);
    }
  }

  return <>
    {catalogError && <p role="alert" className="rounded-lg border border-line bg-canvas-elevated p-5">Plans could not be loaded. Please try again later.</p>}
    {!plans && !catalogError && <p role="status" className="py-12 text-ink-muted">Loading plans…</p>}
    {plans && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {plans.map((plan) => <article key={plan.key} className={`relative flex min-h-[23rem] flex-col border p-6 sm:p-7 ${plan.recommended ? "border-accent bg-accent-soft/30" : "border-line bg-canvas-elevated"}`}>
        <div className="flex min-h-7 items-start justify-end gap-3">
          {plan.recommended && <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-fg">Recommended</span>}
        </div>
        <h2 className="mt-5 font-display text-2xl font-semibold">{plan.name}</h2>
        <p className="mt-2 min-h-12 text-sm leading-relaxed text-ink-muted">{planBlurbs[plan.key] ?? "Organization plan"}</p>
        <div className="mt-6 border-b border-line pb-6">
          {plan.monthlyUsd === null ? <p className="font-display text-3xl font-semibold">Custom quote</p> : <p><strong className="font-display text-4xl font-semibold">${plan.monthlyUsd}</strong><span className="ml-2 text-sm text-ink-muted">/ month</span></p>}
        </div>
        <div className="flex-1 py-6 text-sm leading-7">
          {plan.auditLimit === null ? <p>Audit and monitoring limits agreed with your organization.</p> : <>
            <p><strong>{plan.auditLimit.toLocaleString()}</strong> audits / month</p>
            <p>{plan.scheduleLimit === 0 ? "No automatic schedules" : <><strong>{plan.scheduleLimit}</strong> automatic {plan.scheduleLimit === 1 ? "schedule" : "schedules"}</>}</p>
            {plan.minimumIntervalHours !== null && <p>Run as often as every {plan.minimumIntervalHours} {plan.minimumIntervalHours === 1 ? "hour" : "hours"}</p>}
          </>}
        </div>
        {plan.checkoutMode === "contact" ? <button type="button" onClick={() => { setFormOpen(true); setSubmitted(false); }} className="w-full bg-accent px-4 py-3 text-sm font-semibold text-accent-fg hover:opacity-90">Contact us</button>
          : plan.checkoutMode === "self_service" ? (enrollmentOpen
            ? <Link href="/me/billing" className="border border-line px-4 py-3 text-center text-sm font-semibold hover:bg-accent-soft">Choose {plan.name}</Link>
            : <p className="border border-line bg-canvas px-4 py-3 text-center text-sm font-semibold text-ink-muted">Enrollment coming soon</p>)
          : <Link href="/signup" className="border border-line px-4 py-3 text-center text-sm font-semibold hover:bg-accent-soft">Get started free</Link>}
      </article>)}
    </div>}
    {formOpen && <section className="mt-12 border-t border-line pt-10" aria-labelledby="enterprise-inquiry-heading">
      <div className="grid gap-8 md:grid-cols-[1fr_1.3fr]">
        <div><p className="marketing-eyebrow">Enterprise / Talk to us</p><h2 id="enterprise-inquiry-heading" className="mt-3 font-display text-2xl font-semibold">Tell us what you need.</h2><p className="mt-3 text-sm leading-relaxed text-ink-muted">Share your organization and the review or monitoring requirements you have in mind. We will follow up by email.</p></div>
        {submitted ? <div role="status" className="border border-accent bg-accent-soft p-6"><h3 className="text-lg font-semibold">Inquiry received</h3><p className="mt-2 text-sm">Thank you. We will follow up by email.</p></div> : <form onSubmit={sendInquiry} className="grid gap-4 border border-line bg-canvas-elevated p-6">
          <label className="grid gap-1 text-sm font-semibold">Organization name<input name="organizationName" required maxLength={160} className="w-full border border-line bg-canvas p-3 font-normal" /></label>
          <label className="grid gap-1 text-sm font-semibold">Contact name<input name="contactName" required maxLength={120} className="w-full border border-line bg-canvas p-3 font-normal" /></label>
          <label className="grid gap-1 text-sm font-semibold">Email<input name="email" type="email" required maxLength={254} className="w-full border border-line bg-canvas p-3 font-normal" /></label>
          <label className="grid gap-1 text-sm font-semibold">Requirements (optional)<textarea name="requirements" maxLength={2000} rows={4} className="w-full border border-line bg-canvas p-3 font-normal" /></label>
          <Turnstile key={challenge} onToken={setTurnstileToken} />
          {submitError && <p role="alert" className="text-sm text-red-700">Could not send your inquiry. Please try again.</p>}
          <button type="submit" disabled={submitting || verifying} className="bg-accent px-4 py-3 text-sm font-semibold text-accent-fg disabled:opacity-60">{submitting ? "Sending…" : "Send inquiry"}</button>
        </form>}
      </div>
    </section>}
  </>;
}
