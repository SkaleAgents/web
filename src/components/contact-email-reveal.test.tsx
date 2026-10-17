import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ContactEmailReveal } from "./contact-email-reveal";
import { authPost } from "@/lib/email-auth";

vi.mock("@/lib/email-auth", () => ({ authPost: vi.fn() }));

afterEach(cleanup);

it("keeps the address out of the page until the check returns it", async () => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
  vi.mocked(authPost).mockResolvedValue({ email: "help@example.com" });
  const { container } = render(<ContactEmailReveal />);

  expect(container.innerHTML).not.toContain("@");
  fireEvent.click(screen.getByRole("button", { name: "Show email address" }));

  expect(await screen.findByRole("link", { name: "help@example.com", hidden: true })).toHaveAttribute("href", "mailto:help@example.com");
  expect(authPost).toHaveBeenCalledWith("/api/contact/email", { turnstileToken: "development" });
});
