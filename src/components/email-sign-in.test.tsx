import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { authPost } from "@/lib/email-auth";
import { EmailSignIn } from "./email-sign-in";

vi.mock("@/lib/email-auth", () => ({ authPost: vi.fn(async () => ({})), authenticationError: (err: Error) => err.message }));

afterEach(() => { cleanup(); vi.mocked(authPost).mockClear(); });

it("asks for the full name with the email on sign-up and sends both", async () => {
  render(<EmailSignIn signup />);
  expect(screen.getByLabelText("Full name")).toBeRequired();
  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "  Ada Lovelace " } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Email me a sign-up link" }));
  await waitFor(() => expect(authPost).toHaveBeenCalledWith("/api/auth/email", { email: "ada@example.com", purpose: "signin", name: "Ada Lovelace" }));
});

it("does not ask for a name on sign-in", async () => {
  render(<EmailSignIn />);
  expect(screen.queryByLabelText("Full name")).toBeNull();
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Email me a sign-in link" }));
  await waitFor(() => expect(authPost).toHaveBeenCalledWith("/api/auth/email", { email: "ada@example.com", purpose: "signin" }));
});
