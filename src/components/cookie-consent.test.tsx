import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CookieConsent } from "./cookie-consent";

afterEach(() => {
  cleanup();
  document.cookie = "skale_cookie_consent=; Max-Age=0; Path=/";
  document.cookie = "skale_retention_later=; Max-Age=0; Path=/";
  vi.unstubAllGlobals();
});

it("asks for cookie consent until the visitor chooses", () => {
  render(<CookieConsent />);
  expect(screen.getByRole("region", { name: "Cookie consent" })).toHaveTextContent("necessary cookies");
  expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy#cookies");
});

it("remembers an acceptance in this browser", () => {
  render(<CookieConsent />);
  fireEvent.click(screen.getByRole("button", { name: "Accept" }));
  expect(screen.queryByRole("region", { name: "Cookie consent" })).not.toBeInTheDocument();
  expect(document.cookie).toContain("skale_cookie_consent=accepted");

  cleanup();
  render(<CookieConsent />);
  expect(screen.queryByRole("region", { name: "Cookie consent" })).not.toBeInTheDocument();
});

it("offers accept and does not offer deny", () => {
  render(<CookieConsent />);
  expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Deny" })).not.toBeInTheDocument();
});

it("asks again when an older denial is stored", () => {
  document.cookie = "skale_cookie_consent=declined; Path=/";
  render(<CookieConsent />);
  expect(screen.getByRole("region", { name: "Cookie consent" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Accept" }));
  expect(document.cookie).toContain("skale_cookie_consent=accepted");
  expect(document.cookie).not.toContain("skale_cookie_consent=declined");
});
