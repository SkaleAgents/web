import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { AccountNavigation } from "./account-navigation";

afterEach(cleanup);

it("lists every personal setting in the profile menu and marks the current one", () => {
  render(<AccountNavigation user={{ id: "u1", displayName: "Ada Lovelace", email: "ada@example.com", grokSubject: null }} pathname="/account/notifications" signingOut={false} onSignOut={() => undefined} />);
  fireEvent.click(screen.getByRole("button", { name: "Ada Lovelace, account menu" }));
  const links = screen.getAllByRole("link");
  expect(links.map(link => [link.textContent, link.getAttribute("href")])).toEqual([
    ["Profile", "/account/profile"], ["Passkeys", "/account/passkeys"], ["Notifications", "/account/notifications"], ["Data and privacy", "/account/data"],
  ]);
  expect(screen.getByRole("link", { name: "Notifications" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
});

it("shows the role in the current team under the profile name in the sidebar", () => {
  render(<AccountNavigation user={{ id: "u1", displayName: "Ada Lovelace", email: "ada@example.com", grokSubject: null }} pathname="/dashboard" showName relation="Admin · Acme" signingOut={false} onSignOut={() => undefined} />);
  expect(screen.getByText("Admin · Acme")).toBeInTheDocument();
});

it("heads the profile menu with the photo, name and email, then the theme choices", () => {
  const { container } = render(<AccountNavigation user={{ id: "u1", displayName: "Ada Lovelace", email: "ada@example.com", avatarUrl: "https://lh3.googleusercontent.com/a/ada", grokSubject: null }} pathname="/dashboard" showName signingOut={false} onSignOut={() => undefined} />);
  fireEvent.click(screen.getByRole("button", { name: "Ada Lovelace, account menu" }));
  const panel = container.querySelector(".account-nav-panel")!;
  expect(panel.querySelector("img")).toHaveAttribute("src", "https://lh3.googleusercontent.com/a/ada");
  expect(panel).toHaveTextContent("ada@example.com");
  expect(screen.getByRole("button", { name: "Ada Lovelace, account menu" })).not.toHaveTextContent("ada@example.com");
  const themes = screen.getByRole("radiogroup", { name: "Color theme" });
  expect(Array.from(themes.querySelectorAll('[role="radio"]')).map(item => item.getAttribute("aria-label"))).toEqual(["Light", "Dark", "System"]);
});
