import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SignInOptions } from "./sign-in-options";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const order = () => screen.getAllByRole("link").concat(screen.queryAllByRole("button")).sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1).map(node => node.textContent?.trim());

it("leads sign-in with a passkey, then Google, GitHub, and email", () => {
  vi.stubGlobal("PublicKeyCredential", class {});
  vi.stubGlobal("isSecureContext", true);
  render(<SignInOptions emailPath="/login/email" />);
  expect(order().slice(0, 4)).toEqual(["Sign in with a passkey", "Continue with Google", "Continue with GitHub", "Continue with email"]);
  expect(screen.queryByText(/By signing up/)).toBeNull();
});

it("offers sign-up three options and the terms, never a passkey", () => {
  vi.stubGlobal("PublicKeyCredential", class {});
  vi.stubGlobal("isSecureContext", true);
  render(<SignInOptions emailPath="/signup/email" signup />);
  expect(order().slice(0, 3)).toEqual(["Continue with Google", "Continue with GitHub", "Continue with email"]);
  expect(screen.queryByRole("button", { name: "Sign in with a passkey" })).toBeNull();
  expect(screen.getByText(/By signing up, you agree/)).toBeVisible();
});

it("falls back to the sign-up order when the browser has no passkeys", () => {
  vi.stubGlobal("PublicKeyCredential", undefined);
  render(<SignInOptions emailPath="/login/email" />);
  expect(screen.queryByRole("button", { name: "Sign in with a passkey" })).toBeNull();
  expect(order()[0]).toBe("Continue with Google");
});
