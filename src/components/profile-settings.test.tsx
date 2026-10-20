import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { ProfileSettings } from "./profile-settings";

vi.mock("@/lib/api", async (original) => ({ ...await original<typeof import("@/lib/api")>(), apiFetch: vi.fn(), ensureCsrfCookie: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

const user = { id: "u1", displayName: "Old Name", email: "ada@example.com", grokSubject: null };

it("saves a new name and updates the signed-in user", async () => {
  const client = new QueryClient();
  vi.mocked(apiFetch).mockResolvedValueOnce({ ...user, displayName: "Ada Lovelace" });
  render(<QueryClientProvider client={client}><ProfileSettings user={user} /></QueryClientProvider>);
  const save = screen.getByRole("button", { name: "Save changes" });
  expect(save).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: " Ada Lovelace " } });
  fireEvent.click(save);
  expect(await screen.findByText("Profile saved.")).toBeVisible();
  expect(apiFetch).toHaveBeenCalledWith("/api/account/profile", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ accountId: "u1", name: "Ada Lovelace" }) }));
  expect(client.getQueryData(currentUserOptions.queryKey)).toMatchObject({ displayName: "Ada Lovelace" });
});

it("shows the server error and keeps the typed name", async () => {
  vi.mocked(apiFetch).mockRejectedValueOnce(new Error("Your account changed."));
  render(<QueryClientProvider client={new QueryClient()}><ProfileSettings user={user} /></QueryClientProvider>);
  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "New" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Your account changed.");
  expect(screen.getByLabelText("Full name")).toHaveValue("New");
});
