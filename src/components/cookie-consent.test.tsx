import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CookieConsent } from "./cookie-consent";

afterEach(() => {
  cleanup();
  document.cookie = "skale_cookie_consent=; Max-Age=0; Path=/";
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

it("lets a visitor deny optional cookies", () => {
  render(<CookieConsent />);
  fireEvent.click(screen.getByRole("button", { name: "Deny" }));
  expect(screen.queryByRole("region", { name: "Cookie consent" })).not.toBeInTheDocument();
  expect(document.cookie).toContain("skale_cookie_consent=declined");
});
