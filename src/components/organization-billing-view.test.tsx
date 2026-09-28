import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

function showBilling(plan: "free" | "starter", testModeEnabled: boolean, paymentUrl: string | null = null, checkoutReturnOrganizationId: string | null = null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(["user"], { id: "owner-1", email: "owner@example.test", displayName: "Owner", grokSubject: null });
  vi.mocked(apiFetch).mockImplementation(async (path, init) => {
    if (path === "/api/workspaces") return { data: [{ id: "org-1", name: "Acme", role: "owner" }] } as never;
    if (path === "/api/organization-plans") return plans as never;
    if (path === "/api/workspaces/org-1/billing") return {
      plan, usage: { used: plan === "free" ? 1 : 7, limit: plan === "free" ? 2 : 25, remaining: plan === "free" ? 1 : 18, periodEnd: "2026-10-01T00:00:00Z" },
      pendingChange: paymentUrl ? { id: "change-1", toPlan: "pro", status: "pending_payment", effectiveAt: null, paymentUrl } : null, testModeEnabled,
    } as never;
    if (path === "/api/workspaces/org-1/billing/change-plan" && init?.method === "POST") return { id: "change-1", status: "effective" } as never;
    if (path === "/api/workspaces/org-1/billing/checkout" && init?.method === "POST") return { url: "https://checkout.stripe.com/c/pay/cs_test_fixture" } as never;
    throw new Error(`Unexpected request: ${path}`);
  });
  return render(<QueryClientProvider client={client}><OrganizationBillingView checkoutReturnOrganizationId={checkoutReturnOrganizationId} /></QueryClientProvider>);
}

it("shows payment verification as pending until the organization has a paid plan", async () => {
  showBilling("free", true, null, "org-1");
  expect(await screen.findByRole("status", { name: "Checkout status" })).toHaveTextContent("Checking your payment");
});

it("confirms the active paid plan after checkout reconciliation", async () => {
  showBilling("starter", true, null, "org-1");
  expect(await screen.findByRole("status", { name: "Checkout status" })).toHaveTextContent("Starter is active");
});

it("shows the current allowance but keeps checkout closed when the API gate is off", async () => {
  showBilling("starter", false);
  await screen.findByText("18 audits remaining");
  expect(screen.getByText("Plan changes are not available yet.")).toBeVisible();
  expect(screen.getByRole("button", { name: "Upgrade to Pro" })).toBeDisabled();
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
