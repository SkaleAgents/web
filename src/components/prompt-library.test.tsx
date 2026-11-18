import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { PromptLibrary } from "./prompt-library";

vi.mock("next/navigation", () => ({ usePathname: () => "/org/o1/prompts" }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api", async (load) => ({ ...(await load<typeof import("@/lib/api")>()), apiFetch: vi.fn(), ensureCsrfCookie: vi.fn() }));

afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

const prompt = { id: "p1", title: "Mine", body: "Body", tags: [], ownerUserId: "u1", createdAt: "", updatedAt: "" };

function renderManage() {
  vi.mocked(apiFetch).mockImplementation(async (path: string, init?: RequestInit) => {
    if (path === "/api/user") return { id: "u1" } as never;
    if (path === "/api/prompts" && !init?.method) return { prompts: [prompt] } as never;
    return undefined as never;
  });
  render(<QueryClientProvider client={new QueryClient()}><PromptLibrary manage /></QueryClientProvider>);
}

it("deletes a saved prompt only after the owner confirms", async () => {
  renderManage();
  const button = await screen.findByRole("button", { name: "Delete Mine" });
  vi.stubGlobal("confirm", vi.fn(() => false));
  fireEvent.click(button);
  expect(apiFetch).not.toHaveBeenCalledWith("/api/prompts/p1", expect.anything());
  vi.stubGlobal("confirm", vi.fn(() => true));
  fireEvent.click(button);
  await waitFor(() => expect(apiFetch).toHaveBeenCalledWith("/api/prompts/p1", { method: "DELETE" }));
});
