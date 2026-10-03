import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    if (path === "/api/staff/enterprise-inquiries") return { data: [{
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

it("shows an empty staff list", async () => {
  vi.mocked(apiFetch).mockImplementation(async (path) => path === "/api/user" ? operator : { data: [] });
  renderInquiries();
  expect(await screen.findByText("No Enterprise inquiries yet.")).toBeVisible();
});

it("links staff to the inquiries page from the account menu", () => {
  render(<AccountNavigation user={operator} settingsActive={false} signingOut={false} onSignOut={() => undefined} />);
  fireEvent.click(screen.getByRole("button", { name: "Owner, account menu" }));
  expect(screen.getByRole("link", { name: "Enterprise inquiries" })).toHaveAttribute("href", "/staff/enterprise-inquiries");
});

it("hides the inquiries link for a customer account", () => {
  render(<AccountNavigation user={{ ...operator, staffRole: null }} settingsActive={false} signingOut={false} onSignOut={() => undefined} />);
  fireEvent.click(screen.getByRole("button", { name: "Owner, account menu" }));
  expect(screen.queryByRole("link", { name: "Enterprise inquiries" })).not.toBeInTheDocument();
});
