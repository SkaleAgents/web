import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { ConsentGate } from "./consent-gate";
import { GET } from "@/app/consent-region/route";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("reports consent as required only for European countries, uncached", async () => {
  const de = GET(new Request("https://skaleagents.com/consent-region", { headers: { "cf-ipcountry": "DE" } }));
  expect(await de.json()).toEqual({ required: true });
  expect(de.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await GET(new Request("https://skaleagents.com/consent-region", { headers: { "cf-ipcountry": "US" } })).json()).toEqual({ required: false });
});

it("shows the notice after the region says consent is required", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ required: true })));
  render(<ConsentGate />);
  expect(screen.queryByRole("region", { name: "Cookie consent" })).toBeNull();
  await waitFor(() => expect(screen.getByRole("region", { name: "Cookie consent" })).toBeInTheDocument());
});

it("shows no notice when the region lookup fails", async () => {
  const fetch = vi.fn(async () => { throw new Error("offline"); });
  vi.stubGlobal("fetch", fetch);
  render(<ConsentGate />);
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  expect(screen.queryByRole("region", { name: "Cookie consent" })).toBeNull();
});
