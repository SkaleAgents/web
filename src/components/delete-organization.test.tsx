import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "@/lib/api";
import { DeleteOrganization } from "./delete-organization";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("@/lib/api", async (load) => ({ ...(await load<typeof import("@/lib/api")>()), apiFetch: vi.fn(), ensureCsrfCookie: vi.fn() }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

function renderDelete() {
  render(<QueryClientProvider client={new QueryClient()}><DeleteOrganization organization={{ id: "org-1", name: "Acme Labs" }} /></QueryClientProvider>);
}

it("needs the exact organization name", () => {
  renderDelete();
  const button = screen.getByRole("button", { name: "Delete organization" });
  fireEvent.change(screen.getByLabelText(/to confirm/), { target: { value: "acme labs" } });
  expect(button).toBeDisabled();
  fireEvent.change(screen.getByLabelText(/to confirm/), { target: { value: "Acme Labs" } });
  expect(button).toBeEnabled();
});

it("shows blockers, then deletes and returns to Personal", async () => {
  renderDelete();
  fireEvent.change(screen.getByLabelText(/to confirm/), { target: { value: "Acme Labs" } });
  vi.mocked(apiFetch).mockRejectedValueOnce(new ApiError("This organization can't be deleted yet.", 409, ["Delete the organization's 2 audits first."]));
  fireEvent.click(screen.getByRole("button", { name: "Delete organization" }));
  expect(await screen.findByText("Delete the organization's 2 audits first.")).toBeVisible();
  vi.mocked(apiFetch).mockResolvedValueOnce({ deleted: true } as never);
  fireEvent.click(screen.getByRole("button", { name: "Delete organization" }));
  await waitFor(() => expect(push).toHaveBeenCalledWith("/me"));
  expect(apiFetch).toHaveBeenLastCalledWith("/api/workspaces/org-1", { method: "DELETE", body: JSON.stringify({ name: "Acme Labs" }) });
});
