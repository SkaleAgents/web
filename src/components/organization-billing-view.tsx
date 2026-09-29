"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui";
import { apiFetch, ensureCsrfCookie } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";

type Organization = { id: string; name: string; role: "owner" | "member" | "viewer"; kind: "personal" | "team" };
type Plan = { key: string; name: string; monthlyUsd: number | null; auditLimit: number | null; checkoutMode: string };
type Billing = {
  plan: string;
  usage: { used: number; limit: number; remaining: number; periodEnd: string } | null;
  pendingChange: { id: string; kind: string; toPlan: string; status: string; effectiveAt: string | null; paymentUrl: string | null } | null;
  renewalPayment: { status: "grace" | "access_paused" | "finalizing" | "finalization_paused"; graceEndsAt: string | null; finalizationEndsAt: string | null; paymentUrl: string | null } | null;
  testModeEnabled: boolean;
  cancellationEnabled: boolean;
};

function approvedCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "checkout.stripe.com";
  } catch {
    return false;
  }
}

function approvedInvoiceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "invoice.stripe.com";
  } catch {
    return false;
  }
}

function utcDate(value: string): string {
  return `${new Date(value).toLocaleDateString("en-US", { timeZone: "UTC" })} UTC`;
}

export function OrganizationBillingView({ checkoutReturnOrganizationId = null, organizationId: fixedOrganizationId }: { checkoutReturnOrganizationId?: string | null; organizationId?: string }) {
  const user = useQuery(currentUserOptions);
  const client = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(checkoutReturnOrganizationId);
  const [checkoutLink, setCheckoutLink] = useState<{ organizationId: string; url: string } | null>(null);
  const organizations = useQuery({
    queryKey: ["billing-organizations", user.data?.id],
    enabled: Boolean(user.data?.id),
    queryFn: async ({ signal }) => (await apiFetch<{ data: Organization[] }>("/api/workspaces", { signal })).data,
  });
  const catalog = useQuery({
    queryKey: ["organization-plans"],
    queryFn: async ({ signal }) => (await apiFetch<{ data: Plan[] }>("/api/organization-plans", { signal })).data,
  });
  const owned = organizations.data?.filter((organization) => organization.kind === "team" && organization.role === "owner") ?? [];
  const fixedOrganizationUnavailable = Boolean(fixedOrganizationId && organizations.isSuccess && !owned.some((organization) => organization.id === fixedOrganizationId));
  const organizationId = fixedOrganizationId
    ? owned.find((organization) => organization.id === fixedOrganizationId)?.id
    : owned.find((organization) => organization.id === selectedId)?.id ?? owned[0]?.id;
  const billing = useQuery({
    queryKey: ["organization-billing", organizationId],
    enabled: Boolean(organizationId),
    queryFn: ({ signal }) => apiFetch<Billing>(`/api/workspaces/${organizationId}/billing`, { signal }),
    refetchInterval: (query) => checkoutReturnOrganizationId === organizationId && query.state.data?.plan === "free" ? 5000 : false,
  });
  const change = useMutation({
    mutationFn: async ({ plan, organizationId: requestedId, fromPlan }: { plan: string; organizationId: string; fromPlan: string }) => {
      await ensureCsrfCookie();
      if (fromPlan === "free") {
        const result = await apiFetch<{ url: string }>(`/api/workspaces/${requestedId}/billing/checkout`, {
          method: "POST", body: JSON.stringify({ plan }),
        });
        if (!approvedCheckoutUrl(result.url)) throw new Error("The checkout link was not valid. Try again.");
        return { organizationId: requestedId, url: result.url };
      }
      const result = await apiFetch<{ status: string }>(`/api/workspaces/${requestedId}/billing/change-plan`, {
        method: "POST", body: JSON.stringify({ plan }),
      });
      if (result.status === "expired") throw new Error("The previous upgrade invoice expired. Choose the plan again to start a new payment.");
      return null;
    },
    onSuccess: (link) => {
      setCheckoutLink(link);
    },
    onSettled: async (_result, _error, variables) => {
      await client.invalidateQueries({ queryKey: ["organization-billing", variables.organizationId] });
    },
  });
  const cancel = useMutation({
    mutationFn: async (requestedId: string) => {
      await ensureCsrfCookie();
      return apiFetch(`/api/workspaces/${requestedId}/billing/cancel`, { method: "POST" });
    },
    onSettled: async (_result, _error, requestedId) => {
      await client.invalidateQueries({ queryKey: ["organization-billing", requestedId] });
    },
  });
  const currentPlan = catalog.data?.find((plan) => plan.key === billing.data?.plan);
  const pendingPlanName = catalog.data?.find((plan) => plan.key === billing.data?.pendingChange?.toPlan)?.name ?? billing.data?.pendingChange?.toPlan;
  const paidPlans = catalog.data?.filter((plan) => plan.checkoutMode === "self_service") ?? [];
  const currentPrice = currentPlan?.monthlyUsd ?? 0;
  const showingCheckoutReturn = Boolean(checkoutReturnOrganizationId && checkoutReturnOrganizationId === organizationId);

  return <main className="mx-auto max-w-4xl space-y-8">
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Organization billing</h1>
      <p className="mt-2 text-sm text-ink-muted">Check your audit allowance and manage the plan for an organization you own.</p>
    </div>
    {user.isError || organizations.isError || catalog.isError ? <p role="alert" className="text-sm text-danger">Billing details could not be loaded. Refresh the page and try again.</p> : null}
    {organizations.isPending || catalog.isPending || user.isPending ? <p role="status" className="text-sm text-ink-muted">Loading billing details…</p> : null}
    {fixedOrganizationUnavailable ? <p role="alert" className="text-sm text-danger">Billing unavailable for this organization.</p> : null}
    {organizations.isSuccess && owned.length === 0 && !fixedOrganizationId ? <p className="text-sm text-ink-muted">You do not own an organization yet. <Link href="/dashboard/workspaces" className="underline">Create one in Organizations</Link>.</p> : null}
    {owned.length > 0 && !fixedOrganizationId ? <div className="space-y-2">
      <label className="block max-w-sm text-sm font-medium text-ink" htmlFor="billing-organization">Organization</label>
      <select id="billing-organization" className="w-full max-w-sm rounded-md border border-line bg-canvas-elevated px-3 py-2 text-ink" value={organizationId} onChange={(event) => { setSelectedId(event.target.value); setCheckoutLink(null); change.reset(); cancel.reset(); }}>
        {owned.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
      </select>
    </div> : null}
    {billing.isError ? <p role="alert" className="text-sm text-danger">The billing record is unavailable. Refresh before changing a plan.</p> : null}
    {showingCheckoutReturn && billing.data ? <p role="status" aria-label="Checkout status" className="border-l-2 border-accent bg-accent-soft px-4 py-3 text-sm text-ink">
      {billing.data.plan === "free" ? "Checking your payment. Your plan will update here after verification." : `${currentPlan?.name ?? "Your paid plan"} is active. Your audit allowance is shown below.`}
    </p> : null}
    {billing.data && currentPlan && organizationId ? <>
      {billing.data.renewalPayment ? <section role="status" aria-label="Renewal payment" className="border-l-2 border-danger bg-canvas-elevated px-4 py-3 text-sm text-ink">
        <p className="font-semibold">{{
          grace: "Renewal payment is overdue.", access_paused: "Paid audit access is paused.",
          finalizing: "Stripe is finalizing your renewal invoice.",
          finalization_paused: "Waiting for Stripe to finalize your renewal invoice.",
        }[billing.data.renewalPayment.status]}</p>
        <p className="mt-1">{billing.data.renewalPayment.status === "finalizing"
          ? `Your remaining temporary audits are available through ${utcDate(billing.data.renewalPayment.finalizationEndsAt!)}. They will count toward the new cycle after Stripe verifies the invoice.`
          : billing.data.renewalPayment.status === "finalization_paused"
            ? `The temporary audit window ended ${utcDate(billing.data.renewalPayment.finalizationEndsAt!)}. New audits are paused until Stripe verifies the invoice.`
            : billing.data.renewalPayment.status === "grace"
              ? `Your paid audit limits remain available through ${utcDate(billing.data.renewalPayment.graceEndsAt!)} while Stripe retries. Pay the renewal invoice to avoid an interruption.`
              : `The seven-day payment grace period ended ${utcDate(billing.data.renewalPayment.graceEndsAt!)}. Pay the renewal invoice to request restored access after verification.`}</p>
        <p className="mt-1 text-ink-muted">Stripe test mode is active. No real payment will be collected.</p>
        {(billing.data.renewalPayment.status === "grace" || billing.data.renewalPayment.status === "access_paused") && billing.data.renewalPayment.paymentUrl && approvedInvoiceUrl(billing.data.renewalPayment.paymentUrl) ? <a className="mt-3 inline-flex rounded-md bg-ink px-4 py-2 font-semibold text-canvas hover:opacity-90" href={billing.data.renewalPayment.paymentUrl}>Pay renewal invoice</a> : null}
      </section> : null}
      {billing.data.usage ? <section className="border-y border-line py-6" aria-label="Current plan">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm text-ink-muted">Current plan</p><p className="mt-1 text-3xl font-semibold text-ink">{currentPlan.name}</p></div>
          <p className="text-sm text-ink-muted">{billing.data.usage.remaining.toLocaleString()} audits remaining</p>
        </div>
        <progress className="mt-5 w-full" max={billing.data.usage.limit} value={billing.data.usage.used} aria-label="Audits used this period" />
        <p className="mt-2 text-sm text-ink-muted">{billing.data.usage.used.toLocaleString()} of {billing.data.usage.limit.toLocaleString()} audits used. {billing.data.renewalPayment?.status === "finalizing" ? `Temporary access ends ${utcDate(billing.data.usage.periodEnd)}.` : `Resets ${utcDate(billing.data.usage.periodEnd)}.`}</p>
      </section> : <p role="status" className="text-sm text-ink-muted">{billing.data.renewalPayment?.status === "finalization_paused" ? "Audit allowance is paused until Stripe verifies the renewal invoice." : "Audit allowance is unavailable until renewal payment is verified."}</p>}
      {billing.data.pendingChange ? <p role="status" className="border-l-2 border-ink px-4 text-sm text-ink">
        {billing.data.pendingChange.status === "pending_cycle"
          ? billing.data.pendingChange.kind === "cancellation"
            ? `Cancellation is scheduled. ${pendingPlanName} starts at your next renewal${billing.data.pendingChange.effectiveAt ? ` on ${utcDate(billing.data.pendingChange.effectiveAt)}` : ""}. Your current plan stays active until then.`
            : `${pendingPlanName} starts at your next renewal.`
          : `Your ${pendingPlanName} change is waiting for payment confirmation. Your current plan remains active.`}
      </p> : null}
      {billing.data.testModeEnabled && billing.data.pendingChange?.paymentUrl && approvedInvoiceUrl(billing.data.pendingChange.paymentUrl) ? <a className="inline-flex rounded-md bg-ink px-4 py-2 text-sm font-semibold text-canvas hover:opacity-90" href={billing.data.pendingChange.paymentUrl}>Pay prorated invoice</a> : null}
      {billing.data.plan !== "free" && billing.data.pendingChange?.kind !== "cancellation" ? <div className="space-y-2">
        <Button type="button" variant="secondary" disabled={!billing.data.cancellationEnabled || cancel.isPending || billing.data.pendingChange?.status === "pending_payment" || billing.data.pendingChange?.status === "creating"} onClick={() => cancel.mutate(organizationId)}>Cancel at renewal</Button>
        <p className="text-sm text-ink-muted">Your paid plan stays active through the current billing cycle. A scheduled downgrade will be replaced.</p>
        {cancel.isError ? <p role="alert" className="text-sm text-danger">{cancel.error.message}</p> : null}
      </div> : null}
      <section className="space-y-4" aria-labelledby="billing-change-heading">
        <h2 id="billing-change-heading" className="text-xl font-semibold text-ink">Change plan</h2>
        {!billing.data.testModeEnabled ? <p className="text-sm text-ink-muted">Plan changes are not available yet.</p> : <p className="text-sm text-ink-muted">Stripe test mode is active. No real payment will be collected here.</p>}
        <div className="divide-y divide-line border-y border-line">
          {paidPlans.map((plan) => {
            const isCurrent = plan.key === billing.data.plan;
            const isUpgrade = (plan.monthlyUsd ?? 0) > currentPrice;
            const label = billing.data.plan === "free" ? `Start ${plan.name}` : isUpgrade ? `Upgrade to ${plan.name}` : `Schedule ${plan.name} at renewal`;
            return <div key={plan.key} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div><h3 className="font-semibold text-ink">{plan.name}</h3><p className="text-sm text-ink-muted">${plan.monthlyUsd} per month · {plan.auditLimit?.toLocaleString()} audits</p></div>
              {isCurrent ? <span className="text-sm text-ink-muted">Current plan</span> : <Button type="button" variant="secondary" disabled={!billing.data.testModeEnabled || change.isPending || Boolean(billing.data.pendingChange) || Boolean(billing.data.renewalPayment)} onClick={() => change.mutate({ plan: plan.key, organizationId, fromPlan: billing.data.plan })}>{label}</Button>}
            </div>;
          })}
        </div>
        {change.isError ? <p role="alert" className="text-sm text-danger">{change.error.message}</p> : null}
        {billing.data.testModeEnabled && checkoutLink?.organizationId === organizationId ? <a className="inline-flex rounded-md bg-ink px-4 py-2 text-sm font-semibold text-canvas hover:opacity-90" href={checkoutLink?.url}>Continue to secure checkout</a> : null}
      </section>
    </> : null}
  </main>;
}
