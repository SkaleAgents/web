import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { OrganizationBillingView } from "@/components/organization-billing-view";
import { apiFetch, ensureCsrfCookie } from "@/lib/api";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn(), ensureCsrfCookie: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

const plans = { data: [
  { key: "free", name: "Free", monthlyUsd: 0, auditLimit: 2, checkoutMode: "included" },
  { key: "starter", name: "Starter", monthlyUsd: 19, auditLimit: 25, checkoutMode: "self_service" },
  { key: "pro", name: "Pro", monthlyUsd: 49, auditLimit: 200, checkoutMode: "self_service" },
  { key: "max", name: "Max", monthlyUsd: 499, auditLimit: 2000, checkoutMode: "self_service" },
] };

function showBilling(plan: "free" | "starter" | "pro", testModeEnabled: boolean, paymentUrl: string | null = null, checkoutReturnOrganizationId: string | null = null, pendingCyclePlan: string | null = null, renewalPayment: { status: "grace" | "access_paused"; graceEndsAt: string; paymentUrl: string | null } | null = null, cutoverNoticeAvailable = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(["user"], { id: "owner-1", email: "owner@example.test", displayName: "Owner", grokSubject: null });
  vi.mocked(apiFetch).mockImplementation(async (path, init) => {
    if (path === "/api/workspaces") return { data: [{ id: "org-1", name: "Acme", kind: "team", role: "owner", cutoverNoticeAvailable }] } as never;
    if (path === "/api/organization-plans") return plans as never;
    if (path === "/api/workspaces/org-1/billing") return {
      plan, usage: { used: plan === "free" ? 1 : 7, limit: plan === "free" ? 2 : plan === "starter" ? 25 : 200, remaining: plan === "free" ? 1 : plan === "starter" ? 18 : 193, periodEnd: "2026-10-01T00:00:00Z" },
      pendingChange: paymentUrl ? { id: "change-1", toPlan: "pro", status: "pending_payment", effectiveAt: null, paymentUrl }
        : pendingCyclePlan ? { id: "change-2", kind: pendingCyclePlan === "free" ? "cancellation" : "downgrade", toPlan: pendingCyclePlan, status: "pending_cycle", effectiveAt: "2026-10-01T00:00:00Z", paymentUrl: null } : null, testModeEnabled, cancellationEnabled: true,
      renewalPayment,
    } as never;
    if (path === "/api/workspaces/org-1/billing/change-plan" && init?.method === "POST") return { id: "change-1", status: "effective" } as never;
    if (path === "/api/workspaces/org-1/billing/cancel" && init?.method === "POST") return { id: "change-3", status: "pending_cycle" } as never;
    if (path === "/api/workspaces/org-1/billing/checkout" && init?.method === "POST") return { url: "https://checkout.stripe.com/c/pay/cs_test_fixture" } as never;
    throw new Error(`Unexpected request: ${path}`);
  });
  return { ...render(<QueryClientProvider client={client}><OrganizationBillingView checkoutReturnOrganizationId={checkoutReturnOrganizationId} /></QueryClientProvider>), client };
}

it("links an owner to a published Free organization notice only when available", async () => {
  showBilling("free", false, null, null, null, null, true);
  const link = await screen.findByRole("link", { name: "Review Free plan notice" });
  expect(link).toHaveAttribute("href", "/org/org-1/settings/cutover-notice");
});

it("shows payment verification as pending until the organization has a paid plan", async () => {
  showBilling("free", true, null, "org-1");
  expect(await screen.findByRole("status", { name: "Checkout status" })).toHaveTextContent("Checking your payment");
});

it("explains renewal grace and offers a verified invoice when new checkout is closed", async () => {
  showBilling("pro", false, null, null, null, { status: "grace", graceEndsAt: "2026-10-08T00:00:00Z", paymentUrl: "https://invoice.stripe.com/i/renewal_fixture" });
  expect(await screen.findByText(/Renewal payment is overdue/)).toBeVisible();
  expect(screen.getByText(/10\/8\/2026 UTC/)).toBeVisible();
  expect(screen.getByRole("link", { name: "Pay renewal invoice" })).toHaveAttribute("href", "https://invoice.stripe.com/i/renewal_fixture");
});

it("does not offer an untrusted renewal invoice", async () => {
  showBilling("pro", true, null, null, null, { status: "grace", graceEndsAt: "2026-10-08T00:00:00Z", paymentUrl: "https://evil.example/i/renewal_fixture" });
  await screen.findByText(/Renewal payment is overdue/);
  expect(screen.queryByRole("link", { name: "Pay renewal invoice" })).not.toBeInTheDocument();
});

it("shows payment recovery without claiming an audit allowance after grace", async () => {
  const { client } = showBilling("pro", false);
  await screen.findByText("193 audits remaining");
  client.setQueryData(["organization-billing", "org-1"], {
    plan: "pro", usage: null, pendingChange: null, testModeEnabled: false, cancellationEnabled: true,
    renewalPayment: { status: "access_paused", graceEndsAt: "2026-10-08T00:00:00Z", paymentUrl: "https://invoice.stripe.com/i/renewal_fixture" },
  });
  expect(await screen.findByText("Paid audit access is paused.")).toBeVisible();
  expect(screen.queryByText("193 audits remaining")).not.toBeInTheDocument();
  expect(screen.getByText("Audit allowance is unavailable until renewal payment is verified.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Pay renewal invoice" })).toBeVisible();
});

it("shows an unpaid organization as paused with a verified recovery link", async () => {
  const { client } = showBilling("pro", true);
  await screen.findByText("193 audits remaining");
  client.setQueryData(["organization-billing", "org-1"], {
    plan: "pro", usage: null, pendingChange: null, testModeEnabled: true, cancellationEnabled: true,
    renewalPayment: { status: "unpaid", graceEndsAt: "2026-10-08T00:00:00Z", finalizationEndsAt: null, paymentUrl: "https://invoice.stripe.com/i/unpaid_fixture" },
  });
  expect(await screen.findByText(/new audits and schedules are paused/i)).toBeVisible();
  expect(screen.queryByText("193 audits remaining")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Pay renewal invoice" })).toHaveAttribute("href", "https://invoice.stripe.com/i/unpaid_fixture");
});

it("offers support without a payment link when renewal verification is unavailable", async () => {
  const { client } = showBilling("pro", true);
  await screen.findByText("193 audits remaining");
  client.setQueryData(["organization-billing", "org-1"], {
    plan: "pro", usage: null, pendingChange: null, testModeEnabled: true, cancellationEnabled: true,
    renewalPayment: { status: "verification_unavailable", graceEndsAt: "2026-10-08T00:00:00Z", finalizationEndsAt: null, paymentUrl: null },
  });
  expect(await screen.findByText(/could not verify your renewal/i)).toBeVisible();
  expect(screen.queryByRole("link", { name: "Pay renewal invoice" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Contact support" })).toHaveAttribute("href", "mailto:info@skaleagents.com");
});

it("asks the owner to review schedules after verified payment", async () => {
  const { client } = showBilling("pro", true);
  await screen.findByText("193 audits remaining");
  client.setQueryData(["organization-billing", "org-1"], {
    plan: "pro", usage: { used: 7, limit: 200, remaining: 193, periodEnd: "2026-10-01T00:00:00Z" },
    pendingChange: null, testModeEnabled: true, cancellationEnabled: true,
    renewalPayment: { status: "recovered", graceEndsAt: null, finalizationEndsAt: null, paymentUrl: null },
  });
  expect(await screen.findByText(/payment verified/i)).toBeVisible();
  expect(screen.getByRole("link", { name: "Review paused schedules" })).toHaveAttribute("href", "/org/org-1/schedules");
  expect(screen.getByText("193 audits remaining")).toBeVisible();
});

it("explains the temporary draft allowance without offering payment", async () => {
  const { client } = showBilling("pro", true);
  await screen.findByText("193 audits remaining");
  client.setQueryData(["organization-billing", "org-1"], {
    plan: "pro", usage: { used: 2, limit: 25, remaining: 23, periodEnd: "2026-10-01T02:00:00Z" },
    pendingChange: null, testModeEnabled: true, cancellationEnabled: true,
    renewalPayment: { status: "finalizing", graceEndsAt: null, finalizationEndsAt: "2026-10-01T02:00:00Z", paymentUrl: null },
  });
  expect(await screen.findByText(/Stripe is finalizing your renewal invoice/)).toBeVisible();
  expect(screen.getByText("23 audits remaining")).toBeVisible();
  expect(screen.getByRole("status", { name: "Renewal payment" })).toHaveTextContent("10/1/2026 UTC");
  expect(screen.queryByRole("link", { name: "Pay renewal invoice" })).not.toBeInTheDocument();
});

it("pauses new audits after the draft cutoff without implying payment failure", async () => {
  const { client } = showBilling("pro", true);
  await screen.findByText("193 audits remaining");
  client.setQueryData(["organization-billing", "org-1"], {
    plan: "pro", usage: null, pendingChange: null, testModeEnabled: true, cancellationEnabled: true,
    renewalPayment: { status: "finalization_paused", graceEndsAt: null, finalizationEndsAt: "2026-10-01T02:00:00Z", paymentUrl: null },
  });
  expect(await screen.findByText(/Waiting for Stripe to finalize your renewal invoice/)).toBeVisible();
  expect(screen.queryByText("193 audits remaining")).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Pay renewal invoice" })).not.toBeInTheDocument();
});

it("confirms the active paid plan after checkout reconciliation", async () => {
  showBilling("starter", true, null, "org-1");
  expect(await screen.findByRole("status", { name: "Checkout status" })).toHaveTextContent("Starter is active");
});

it("uses the plan name in a scheduled downgrade notice", async () => {
  showBilling("pro", true, null, null, "starter");
  expect(await screen.findByText("Starter starts at your next renewal.")).toBeVisible();
});

it("lets an owner replace a scheduled downgrade with cycle-end cancellation", async () => {
  showBilling("pro", true, null, null, "starter");
  fireEvent.click(await screen.findByRole("button", { name: "Cancel at renewal" }));
  await waitFor(() => expect(apiFetch).toHaveBeenCalledWith("/api/workspaces/org-1/billing/cancel", expect.objectContaining({ method: "POST" })));
  expect(ensureCsrfCookie).toHaveBeenCalledOnce();
});

it("shows scheduled cancellation without offering another cancellation request", async () => {
  showBilling("pro", true, null, null, "free");
  expect(await screen.findByText(/Free starts at your next renewal/)).toBeVisible();
  expect(screen.queryByRole("button", { name: "Cancel at renewal" })).not.toBeInTheDocument();
});

it("shows the current allowance but keeps checkout closed when the API gate is off", async () => {
  showBilling("starter", false);
  await screen.findByText("18 audits remaining");
  expect(screen.getByText("Plan changes are not available yet.")).toBeVisible();
  expect(screen.getByRole("button", { name: "Upgrade to Pro" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Cancel at renewal" })).toBeEnabled();
});

it("requests a paid upgrade from the owner dashboard in staging", async () => {
  showBilling("starter", true);
  fireEvent.click(await screen.findByRole("button", { name: "Upgrade to Pro" }));
  await waitFor(() => expect(apiFetch).toHaveBeenCalledWith("/api/workspaces/org-1/billing/change-plan", expect.objectContaining({ method: "POST", body: JSON.stringify({ plan: "pro" }) })));
  expect(ensureCsrfCookie).toHaveBeenCalledOnce();
});

it("requests hosted Checkout and provides the verified Stripe destination", async () => {
  showBilling("free", true);
  fireEvent.click(await screen.findByRole("button", { name: "Start Starter" }));
  expect(await screen.findByRole("link", { name: "Continue to Stripe" })).toHaveAttribute("href", "https://checkout.stripe.com/c/pay/cs_test_fixture");
  expect(apiFetch).toHaveBeenCalledWith("/api/workspaces/org-1/billing/checkout", expect.objectContaining({ body: JSON.stringify({ plan: "starter", uiMode: "hosted_page" }) }));
  expect(screen.queryByRole("region", { name: "Secure payment" })).not.toBeInTheDocument();
});

it.each(["https://evil.example/pay", "https://checkout.stripe.com.evil.example/pay", "http://checkout.stripe.com/pay", "https://user@checkout.stripe.com/pay"])("rejects untrusted Checkout destination %s", async (url) => {
  showBilling("free", true);
  const previous = vi.mocked(apiFetch).getMockImplementation()!;
  vi.mocked(apiFetch).mockImplementation(async (path, init) => path.endsWith("/billing/checkout") ? { uiMode: "hosted_page", url } as never : previous(path, init));
  fireEvent.click(await screen.findByRole("button", { name: "Start Starter" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Stripe checkout is unavailable");
  expect(screen.queryByRole("link", { name: "Continue to Stripe" })).not.toBeInTheDocument();
});

it("shows the verified invoice payment link for a pending prorated upgrade", async () => {
  showBilling("starter", true, "https://invoice.stripe.com/i/test_fixture");
  const link = await screen.findByRole("link", { name: "Pay prorated invoice" });
  expect(link).toHaveAttribute("href", "https://invoice.stripe.com/i/test_fixture");
  expect(screen.getByRole("button", { name: "Upgrade to Pro" })).toBeDisabled();
});

it("hides an open prorated invoice when test billing is closed", async () => {
  showBilling("starter", false, "https://invoice.stripe.com/i/test_fixture");
  await screen.findByText("Plan changes are not available yet.");
  expect(screen.queryByRole("link", { name: "Pay prorated invoice" })).not.toBeInTheDocument();
});

it("hides a hosted checkout link when test billing closes", async () => {
  const { client } = showBilling("free", true);
  const previous = vi.mocked(apiFetch).getMockImplementation()!;
  vi.mocked(apiFetch).mockImplementation(async (path, init) => path.endsWith("/billing/checkout")
    ? { uiMode: "hosted_page", url: "https://checkout.stripe.com/c/pay/cs_test_fixture" } as never
    : previous(path, init));
  fireEvent.click(await screen.findByRole("button", { name: "Start Starter" }));
  await screen.findByRole("link", { name: "Continue to Stripe" });
  client.setQueryData(["organization-billing", "org-1"], {
    plan: "free", usage: { used: 1, limit: 2, remaining: 1, periodEnd: "2026-10-01T00:00:00Z" },
    pendingChange: null, testModeEnabled: false, cancellationEnabled: true,
  });
  await screen.findByText("Plan changes are not available yet.");
  expect(screen.queryByRole("link", { name: "Continue to Stripe" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Complete sandbox checkout" })).not.toBeInTheDocument();
});

it("keeps an in-flight hosted session with the organization that requested it", async () => {
  let completeCheckout!: (value: { uiMode: string; url: string }) => void;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(["user"], { id: "owner-1", email: "owner@example.test", displayName: "Owner", grokSubject: null });
  vi.mocked(apiFetch).mockImplementation(async (path, init) => {
    if (path === "/api/workspaces") return { data: [{ id: "org-1", name: "First", kind: "team", role: "owner" }, { id: "org-2", name: "Second", kind: "team", role: "owner" }] } as never;
    if (path === "/api/organization-plans") return plans as never;
    if (path.endsWith("/billing") && !init?.method) return { plan: "free", usage: { used: 0, limit: 2, remaining: 2, periodEnd: "2026-10-01T00:00:00Z" }, pendingChange: null, testModeEnabled: true, cancellationEnabled: true } as never;
    if (path === "/api/workspaces/org-1/billing/checkout") return new Promise((resolve) => { completeCheckout = resolve; }) as never;
    throw new Error(`Unexpected request: ${path}`);
  });
  render(<QueryClientProvider client={client}><OrganizationBillingView /></QueryClientProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "Start Starter" }));
  fireEvent.change(screen.getByLabelText("Organization"), { target: { value: "org-2" } });
  await screen.findByText("Second", { selector: "option" });
  await act(async () => { completeCheckout({ uiMode: "hosted_page", url: "https://checkout.stripe.com/c/pay/cs_test_fixture" }); });
  expect(screen.queryByRole("link", { name: "Continue to Stripe" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Complete sandbox checkout" })).not.toBeInTheDocument();
});

it("shows UTC renewal dates consistently", async () => {
  showBilling("pro", true, null, null, "free");
  expect(await screen.findByText(/Free starts at your next renewal on 10\/1\/2026 UTC/)).toBeVisible();
});

it("does not substitute another owner's billing when the URL names an unavailable organization", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["user"], { id: "owner-1", email: "owner@example.test", displayName: "Owner", grokSubject: null });
  vi.mocked(apiFetch).mockImplementation(async (path) => {
    if (path === "/api/workspaces") return { data: [{ id: "org-1", name: "Acme", kind: "team", role: "owner" }] } as never;
    if (path === "/api/organization-plans") return plans as never;
    throw new Error(`Unexpected request: ${path}`);
  });
  render(<QueryClientProvider client={client}><OrganizationBillingView organizationId="org-2" /></QueryClientProvider>);
  expect(await screen.findByRole("alert")).toHaveTextContent("Billing unavailable");
  expect(apiFetch).not.toHaveBeenCalledWith("/api/workspaces/org-1/billing", expect.anything());
});
