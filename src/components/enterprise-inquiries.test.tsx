import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AccountNavigation } from "@/components/account-navigation";
import { EnterpriseInquiries } from "@/components/enterprise-inquiries";
import { ApiError, apiFetch, type ApiUser } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, apiFetch: vi.fn() };
});

afterEach(() => { cleanup(); vi.clearAllMocks(); });

function renderInquiries() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><EnterpriseInquiries /></QueryClientProvider>);
}

const operator: ApiUser = { id: "user-1", email: "owner@example.com", displayName: "Owner", grokSubject: null, staffRole: "operator" };

it("asks a guest to sign in", async () => {
  vi.mocked(apiFetch).mockRejectedValue(new ApiError("Unauthorized", 401));
  renderInquiries();
  expect(await screen.findByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login?next=%2Fstaff%2Fenterprise-inquiries");
  expect(apiFetch).not.toHaveBeenCalledWith("/api/staff/enterprise-inquiries", expect.anything());
});

it("refuses an account without a staff role", async () => {
  vi.mocked(apiFetch).mockResolvedValue({ ...operator, staffRole: null });
  renderInquiries();
  expect(await screen.findByRole("alert")).toHaveTextContent("Staff access required.");
  expect(apiFetch).not.toHaveBeenCalledWith("/api/staff/enterprise-inquiries", expect.anything());
});

it("lists the newest inquiries for an operator", async () => {
  vi.mocked(apiFetch).mockImplementation(async (path) => {
    if (path === "/api/user") return operator;
    if (path === "/api/staff/enterprise-inquiries") return { recipientEmail: "info@skaleagents.com", data: [{
      id: "inq-1", organizationName: "Example Org", contactName: "Alex", email: "alex@example.com",
      requirements: "Custom audit allowance", status: "received", receivedAt: "2026-10-03T06:00:00Z",
    }] };
    throw new Error(String(path));
  });
  renderInquiries();
  expect(await screen.findByRole("heading", { name: "Example Org" })).toBeVisible();
  expect(screen.getByRole("link", { name: "alex@example.com" })).toHaveAttribute("href", "mailto:alex@example.com");
  expect(screen.getByText("Custom audit allowance")).toBeVisible();
  expect(screen.getByText("October 3, 2026 at 6:00 AM UTC")).toBeVisible();
});

it("shows an empty staff list and the default inquiry address", async () => {
  vi.mocked(apiFetch).mockImplementation(async (path) => path === "/api/user" ? operator : { data: [], recipientEmail: "info@skaleagents.com" });
  renderInquiries();
  expect(await screen.findByText("No Enterprise inquiries yet.")).toBeVisible();
  expect(screen.getByLabelText("New inquiries are sent to")).toHaveValue("info@skaleagents.com");
});

it("saves a replacement inquiry address", async () => {
  vi.mocked(apiFetch).mockImplementation(async (path, init) => {
    if (path === "/api/user") return operator;
    if (path === "/api/staff/enterprise-inquiries/recipient") return { email: "owner@example.com" };
    if (init?.method === "PATCH") throw new Error(String(path));
    return { data: [], recipientEmail: "info@skaleagents.com" };
  });
  renderInquiries();
  const input = await screen.findByLabelText("New inquiries are sent to");
  fireEvent.change(input, { target: { value: "owner@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Save email" }));
  await waitFor(() => expect(apiFetch).toHaveBeenCalledWith("/api/staff/enterprise-inquiries/recipient", expect.objectContaining({
    method: "PATCH",
    body: JSON.stringify({ email: "owner@example.com" }),
  })));
  expect(await screen.findByRole("status")).toHaveTextContent("Saved. New inquiries go to owner@example.com.");
});

it("links staff to the inquiries page from the account menu", () => {
  render(<AccountNavigation user={operator} pathname="/staff/enterprise-inquiries" signingOut={false} onSignOut={() => undefined} />);
  fireEvent.click(screen.getByRole("button", { name: "Owner, account menu" }));
  expect(screen.getByRole("link", { name: "Enterprise inquiries" })).toHaveAttribute("href", "/staff/enterprise-inquiries");
});

it("hides the inquiries link for a customer account", () => {
  render(<AccountNavigation user={{ ...operator, staffRole: null }} pathname="/staff/enterprise-inquiries" signingOut={false} onSignOut={() => undefined} />);
  fireEvent.click(screen.getByRole("button", { name: "Owner, account menu" }));
  expect(screen.queryByRole("link", { name: "Enterprise inquiries" })).not.toBeInTheDocument();
});
