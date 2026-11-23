import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EmailSettings } from "./email-settings";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("shows the Binary Labs products opt-in off when the key is missing and saves it like the other toggles", async () => {
  const settings = { accountId: "owner", email: "owner@example.com", emailVerified: true, deliveryEnabled: true, preferences: { auditCompleted: true, auditFailed: true } };
  const patches: unknown[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).endsWith("/sanctum/csrf-cookie")) return new Response(null, { status: 204 });
    if (init?.method === "PATCH") {
      const body = JSON.parse(String(init.body));
      patches.push(body);
      return Response.json({ ...settings, preferences: { ...settings.preferences, binaryLabsProducts: body.binaryLabsProducts } });
    }
    return Response.json(settings);
  }));
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><EmailSettings accountId="owner" /></QueryClientProvider>);

  const optIn = await screen.findByRole("checkbox", { name: /Tell me about other Binary Labs products/ });
  expect(optIn).not.toBeChecked();
  fireEvent.click(optIn);
  await waitFor(() => expect(patches).toEqual([{ accountId: "owner", binaryLabsProducts: true }]));
});
