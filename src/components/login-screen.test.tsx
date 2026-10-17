import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "@/lib/api";
import { LoginScreen } from "./login-screen";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/lib/api", async (load) => {
  const actual = await load<typeof import("@/lib/api")>();
  return { ...actual, apiFetch: vi.fn() };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderLogin(props: { oauth?: boolean; finishConnect?: boolean; email?: boolean; signup?: boolean } = {}) {
  vi.mocked(apiFetch).mockRejectedValue(new ApiError("Unauthorized", 401));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><LoginScreen {...props} /></QueryClientProvider>);
}

it("keeps the MCP connect on the Google link and says the editor is waiting for an account", async () => {
  renderLogin({ oauth: true });

  const google = await screen.findByRole("link", { name: "Continue with Google" });
  expect(google).toHaveAttribute("href", expect.stringMatching(/\/api\/auth\/google\/redirect\?oauth=1$/));
  expect(screen.getByRole("heading", { name: "Connect your editor" })).toBeVisible();
  expect(screen.getByText("Sign in, then you return to allow the MCP connection.")).toBeVisible();
  const github = screen.getByRole("link", { name: "Continue with GitHub" });
  expect(github).toHaveAttribute("href", expect.stringMatching(/\/api\/auth\/github\/redirect\?oauth=1$/));
  expect(google.compareDocumentPosition(github) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.queryByLabelText("Email")).toBeNull();
  expect(screen.getByRole("link", { name: "Continue with email" })).toHaveAttribute("href", "/login/email");
  expect(screen.queryByRole("link", { name: "Terms of Service" })).toBeNull();
  expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/signup");
});

it("shows the terms only on the sign-up page and links back to sign in", async () => {
  renderLogin({ signup: true });

  expect(await screen.findByRole("heading", { name: "Create your SkaleAgents account" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Continue with email" })).toHaveAttribute("href", "/signup/email");
  expect(screen.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
});

it("sign-up email skips the passkey and states the terms", async () => {
  renderLogin({ signup: true, email: true });

  expect(await screen.findByRole("button", { name: "Email me a sign-up link" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Sign in with a passkey" })).toBeNull();
  expect(screen.getByText(/By signing up, you agree to the/)).toBeVisible();
});

it("puts the email sign-in link form on its own page with a way back", async () => {
  renderLogin({ oauth: true, email: true });

  expect(await screen.findByRole("button", { name: "Email me a sign-in link" })).toBeVisible();
  expect(screen.queryByLabelText("Password")).toBeNull();
  expect(screen.queryByRole("link", { name: "Continue with Google" })).toBeNull();
  expect(screen.getByRole("link", { name: "← All sign-in options" })).toHaveAttribute("href", "/login?oauth=1");
});

it("leaves the Google link unchanged when this is not an MCP connect", async () => {
  renderLogin();

  await waitFor(() => expect(screen.getByRole("heading", { name: "Sign in to your control plane" })).toBeVisible());
  const href = screen.getByRole("link", { name: "Continue with Google" }).getAttribute("href") ?? "";
  expect(href).toMatch(/\/api\/auth\/google\/redirect$/);
  expect(href).not.toContain("oauth");
});

it("tells a lost MCP confirmation to finish from the sign-in page", async () => {
  renderLogin({ oauth: true, finishConnect: true });

  expect(await screen.findByText("Finish connecting from the sign-in page.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Continue with Google" })).toHaveAttribute(
    "href",
    expect.stringMatching(/\/api\/auth\/google\/redirect\?oauth=1$/),
  );
});
