import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CookieConsent } from "./cookie-consent";

afterEach(() => {
  cleanup();
  document.cookie = "skale_cookie_consent=; Max-Age=0; Path=/";
  document.cookie = "skale_site_consent=; Max-Age=0; Path=/";
  document.cookie = "skale_retention_later=; Max-Age=0; Path=/";
  vi.unstubAllGlobals();
});

it("asks visitors in Europe to accept or leave", () => {
  render(<CookieConsent required />);
  expect(screen.getByRole("region", { name: "Cookie consent" })).toHaveTextContent("Google Analytics");
  expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy#cookies");
  expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Deny" })).toBeInTheDocument();
});

it("stays hidden outside Europe", () => {
  render(<CookieConsent required={false} />);
  expect(screen.queryByRole("region", { name: "Cookie consent" })).not.toBeInTheDocument();
});

it("remembers an acceptance in this browser", () => {
  render(<CookieConsent required />);
  fireEvent.click(screen.getByRole("button", { name: "Accept" }));
  expect(screen.queryByRole("region", { name: "Cookie consent" })).not.toBeInTheDocument();
  expect(document.cookie).toContain("skale_site_consent=accepted");

  cleanup();
  render(<CookieConsent required />);
  expect(screen.queryByRole("region", { name: "Cookie consent" })).not.toBeInTheDocument();
});

it("sends a denial to Google without storing acceptance", () => {
  const assign = vi.fn();
  vi.stubGlobal("location", { assign, protocol: "http:" });
  render(<CookieConsent required />);
  fireEvent.click(screen.getByRole("button", { name: "Deny" }));
  expect(assign).toHaveBeenCalledWith("https://www.google.com");
  expect(document.cookie).not.toContain("skale_site_consent=accepted");
  expect(screen.getByRole("region", { name: "Cookie consent" })).toBeInTheDocument();
});

it("asks again when an older denial is stored", () => {
  document.cookie = "skale_cookie_consent=declined; Path=/";
  render(<CookieConsent required />);
  expect(screen.getByRole("region", { name: "Cookie consent" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Accept" }));
  expect(document.cookie).toContain("skale_site_consent=accepted");
});

it("asks again when only the previous acceptance cookie is stored", () => {
  document.cookie = "skale_cookie_consent=accepted; Path=/";
  render(<CookieConsent required />);
  expect(screen.getByRole("region", { name: "Cookie consent" })).toBeInTheDocument();
});
