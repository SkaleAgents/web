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

function showBilling(plan: "free" | "starter" | "pro", testModeEnabled: boolean, paymentUrl: string | null = null, checkoutReturnOrganizationId: string | null = null, pendingCyclePlan: string | null = null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(["user"], { id: "owner-1", email: "owner@example.test", displayName: "Owner", grokSubject: null });
  vi.mocked(apiFetch).mockImplementation(async (path, init) => {
    if (path === "/api/workspaces") return { data: [{ id: "org-1", name: "Acme", role: "owner" }] } as never;
    if (path === "/api/organization-plans") return plans as never;
    if (path === "/api/workspaces/org-1/billing") return {
      plan, usage: { used: plan === "free" ? 1 : 7, limit: plan === "free" ? 2 : plan === "starter" ? 25 : 200, remaining: plan === "free" ? 1 : plan === "starter" ? 18 : 193, periodEnd: "2026-10-01T00:00:00Z" },
      pendingChange: paymentUrl ? { id: "change-1", toPlan: "pro", status: "pending_payment", effectiveAt: null, paymentUrl }
        : pendingCyclePlan ? { id: "change-2", kind: pendingCyclePlan === "free" ? "cancellation" : "downgrade", toPlan: pendingCyclePlan, status: "pending_cycle", effectiveAt: "2026-10-01T00:00:00Z", paymentUrl: null } : null, testModeEnabled, cancellationEnabled: true,
    } as never;
    if (path === "/api/workspaces/org-1/billing/change-plan" && init?.method === "POST") return { id: "change-1", status: "effective" } as never;
    if (path === "/api/workspaces/org-1/billing/cancel" && init?.method === "POST") return { id: "change-3", status: "pending_cycle" } as never;
    if (path === "/api/workspaces/org-1/billing/checkout" && init?.method === "POST") return { url: "https://checkout.stripe.com/c/pay/cs_test_fixture" } as never;
    throw new Error(`Unexpected request: ${path}`);
  });
  return { ...render(<QueryClientProvider client={client}><OrganizationBillingView checkoutReturnOrganizationId={checkoutReturnOrganizationId} /></QueryClientProvider>), client };
}

it("shows payment verification as pending until the organization has a paid plan", async () => {
  showBilling("free", true, null, "org-1");
  expect(await screen.findByRole("status", { name: "Checkout status" })).toHaveTextContent("Checking your payment");
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

it("shows a verified Stripe Checkout link only after the server creates a Free upgrade session", async () => {
  showBilling("free", true);
  fireEvent.click(await screen.findByRole("button", { name: "Start Starter" }));
  const link = await screen.findByRole("link", { name: "Continue to secure checkout" });
  expect(link).toHaveAttribute("href", "https://checkout.stripe.com/c/pay/cs_test_fixture");
  expect(apiFetch).toHaveBeenCalledWith("/api/workspaces/org-1/billing/checkout", expect.objectContaining({ method: "POST" }));
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

it("hides a previously issued Checkout link when test billing closes", async () => {
  const { client } = showBilling("free", true);
  fireEvent.click(await screen.findByRole("button", { name: "Start Starter" }));
  await screen.findByRole("link", { name: "Continue to secure checkout" });
  client.setQueryData(["organization-billing", "org-1"], {
    plan: "free", usage: { used: 1, limit: 2, remaining: 1, periodEnd: "2026-10-01T00:00:00Z" },
    pendingChange: null, testModeEnabled: false, cancellationEnabled: true,
  });
  await screen.findByText("Plan changes are not available yet.");
  expect(screen.queryByRole("link", { name: "Continue to secure checkout" })).not.toBeInTheDocument();
});

it("keeps an in-flight Checkout link with the organization that requested it", async () => {
  let completeCheckout!: (value: { url: string }) => void;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(["user"], { id: "owner-1", email: "owner@example.test", displayName: "Owner", grokSubject: null });
  vi.mocked(apiFetch).mockImplementation(async (path, init) => {
    if (path === "/api/workspaces") return { data: [{ id: "org-1", name: "First", role: "owner" }, { id: "org-2", name: "Second", role: "owner" }] } as never;
    if (path === "/api/organization-plans") return plans as never;
    if (path.endsWith("/billing") && !init?.method) return { plan: "free", usage: { used: 0, limit: 2, remaining: 2, periodEnd: "2026-10-01T00:00:00Z" }, pendingChange: null, testModeEnabled: true, cancellationEnabled: true } as never;
    if (path === "/api/workspaces/org-1/billing/checkout") return new Promise((resolve) => { completeCheckout = resolve; }) as never;
    throw new Error(`Unexpected request: ${path}`);
  });
  render(<QueryClientProvider client={client}><OrganizationBillingView /></QueryClientProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "Start Starter" }));
  fireEvent.change(screen.getByLabelText("Organization"), { target: { value: "org-2" } });
  await screen.findByText("Second", { selector: "option" });
  await act(async () => { completeCheckout({ url: "https://checkout.stripe.com/c/pay/cs_test_first" }); });
  expect(screen.queryByRole("link", { name: "Continue to secure checkout" })).not.toBeInTheDocument();
});

it("shows UTC renewal dates consistently", async () => {
  showBilling("pro", true, null, null, "free");
  expect(await screen.findByText(/Free starts at your next renewal on 10\/1\/2026 UTC/)).toBeVisible();
});
