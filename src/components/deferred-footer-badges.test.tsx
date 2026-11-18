import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { DeferredFooterBadges } from "./deferred-footer-badges";
import { FooterBadgesFallback } from "./footer-badges-fallback";
import { saveCookieChoice } from "@/lib/cookie-consent";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.cookie = "skale_site_consent=; Max-Age=0; Path=/";
});

const region = (required: boolean) => vi.stubGlobal("fetch", vi.fn(async () => Response.json({ required })));
const settle = () => act(() => new Promise(resolve => setTimeout(resolve, 20)));

it("loads no third-party badge images in Europe until the visitor accepts", async () => {
  region(true);
  render(<DeferredFooterBadges fallback={<FooterBadgesFallback />} />);
  await settle();
  expect(document.querySelector("img")).toBeNull();
  act(() => saveCookieChoice("accepted"));
  await waitFor(() => expect(document.querySelector("img")).not.toBeNull());
});

it("loads the badges where consent is not required", async () => {
  region(false);
  render(<DeferredFooterBadges fallback={<FooterBadgesFallback />} />);
  await waitFor(() => expect(document.querySelector("img")).not.toBeNull());
});

it("keeps badges off when the region lookup fails", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
  render(<DeferredFooterBadges fallback={<FooterBadgesFallback />} />);
  await settle();
  expect(document.querySelector("img")).toBeNull();
});
