import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { SiteAnalytics } from "./site-analytics";

vi.mock("@next/third-parties/google", () => ({
  GoogleAnalytics: ({ gaId }: { gaId: string }) => (
    // The production component renders this URL through next/script. The test double keeps the same address without Next's one-time script cache.
    // eslint-disable-next-line @next/next/no-sync-scripts
    <script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
  ),
}));

const MEASUREMENT_ID = "G-TEST1234";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  document.cookie = "skale_site_consent=; Max-Age=0; Path=/";
  document.cookie = "skale_cookie_consent=; Max-Age=0; Path=/";
});

function gtagScript() {
  return document.querySelector(`script[src="https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}"]`);
}

it("does not load Google Analytics when the measurement ID is missing", () => {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
  render(<SiteAnalytics consentRequired={false} />);
  expect(gtagScript()).toBeNull();
});

it("loads Google Analytics outside Europe when the measurement ID is set", () => {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", MEASUREMENT_ID);
  render(<SiteAnalytics consentRequired={false} />);
  expect(gtagScript()).not.toBeNull();
});

it("waits for the new consent cookie in Europe", () => {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", MEASUREMENT_ID);
  document.cookie = "skale_cookie_consent=accepted; Path=/";
  render(<SiteAnalytics consentRequired />);
  expect(gtagScript()).toBeNull();

  cleanup();
  document.cookie = "skale_site_consent=accepted; Path=/";
  render(<SiteAnalytics consentRequired />);
  expect(gtagScript()).not.toBeNull();
});
