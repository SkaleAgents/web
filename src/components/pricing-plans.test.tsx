import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PricingPlans } from "@/components/pricing-plans";
import { apiFetch, ensureCsrfCookie } from "@/lib/api";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn(), ensureCsrfCookie: vi.fn() }));
// Turnstile is on and hands over one token per mount, like the real widget.
vi.mock("./turnstile", async () => {
  const { useEffect } = await import("react");
  return { turnstileEnabled: true, Turnstile: ({ onToken }: { onToken: (token: string) => void }) => { useEffect(() => onToken("turnstile-token"), [onToken]); return null; } };
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

const catalog = { data: [
  { key: "free", name: "Free", monthlyUsd: 0, auditLimit: 2, scheduleLimit: 0, minimumIntervalHours: null, recommended: false, checkoutMode: "included" },
  { key: "starter", name: "Starter", monthlyUsd: 19, auditLimit: 25, scheduleLimit: 1, minimumIntervalHours: 48, recommended: false, checkoutMode: "self_service" },
  { key: "pro", name: "Pro", monthlyUsd: 49, auditLimit: 200, scheduleLimit: 10, minimumIntervalHours: 24, recommended: true, checkoutMode: "self_service" },
  { key: "max", name: "Max", monthlyUsd: 499, auditLimit: 2000, scheduleLimit: 100, minimumIntervalHours: 1, recommended: false, checkoutMode: "self_service" },
  { key: "enterprise", name: "Enterprise", monthlyUsd: null, auditLimit: null, scheduleLimit: null, minimumIntervalHours: null, recommended: false, checkoutMode: "contact" },
] };

describe("organization pricing", () => {
  it("renders the ordered catalog without offering checkout or a trial", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(catalog);
    render(<PricingPlans />);
    await screen.findByRole("heading", { name: "Enterprise" });
    expect(screen.getAllByRole("article").map((item) => item.querySelector("h2")?.textContent)).toEqual(["Free", "Starter", "Pro", "Max", "Enterprise"]);
    expect(screen.queryByText(/\/ 05/)).not.toBeInTheDocument();
    expect(screen.getByText("Recommended")).toBeVisible();
    expect(screen.getAllByRole("article")[0]).toHaveTextContent("2 audits / month");
    expect(screen.getAllByText("Enrollment coming soon")).toHaveLength(3);
    expect(screen.queryByText(/free trial/i)).not.toBeInTheDocument();
  });

  it("links paid plans to organization billing when enrollment is open", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ ...catalog, enrollmentOpen: true });
    render(<PricingPlans />);
    expect(await screen.findByRole("link", { name: "Choose Starter" })).toHaveAttribute("href", "/me/billing");
    expect(screen.getByRole("link", { name: "Choose Pro" })).toHaveAttribute("href", "/me/billing");
    expect(screen.getByRole("link", { name: "Choose Max" })).toHaveAttribute("href", "/me/billing");
    expect(screen.queryByText("Enrollment coming soon")).not.toBeInTheDocument();
  });

  it("submits an Enterprise inquiry and waits for the server response", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(catalog).mockResolvedValueOnce({ id: "inquiry-1", status: "received" });
    render(<PricingPlans />);
    fireEvent.click(await screen.findByRole("button", { name: "Contact us" }));
    fireEvent.change(screen.getByLabelText("Organization name"), { target: { value: "Example Org" } });
    fireEvent.change(screen.getByLabelText("Contact name"), { target: { value: "Alex" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alex@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send inquiry" }));
    await screen.findByText("Inquiry received");
    expect(ensureCsrfCookie).toHaveBeenCalledOnce();
    expect(apiFetch).toHaveBeenCalledWith("/api/enterprise-inquiries", expect.objectContaining({ method: "POST", credentials: "include" }));
    expect(JSON.parse(vi.mocked(apiFetch).mock.calls[1][1]!.body as string)).toMatchObject({ email: "alex@example.com", turnstileToken: "turnstile-token" });
  });

  it("keeps the form open after an API failure", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(catalog).mockRejectedValueOnce(new Error("Unavailable"));
    render(<PricingPlans />);
    fireEvent.click(await screen.findByRole("button", { name: "Contact us" }));
    fireEvent.change(screen.getByLabelText("Organization name"), { target: { value: "Example Org" } });
    fireEvent.change(screen.getByLabelText("Contact name"), { target: { value: "Alex" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alex@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send inquiry" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Could not send your inquiry"));
    expect(screen.getByRole("button", { name: "Send inquiry" })).toBeEnabled();
  });
});
