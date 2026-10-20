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
