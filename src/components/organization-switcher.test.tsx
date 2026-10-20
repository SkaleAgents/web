import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { OrganizationSwitcher, type OrganizationMembership } from "./organization-switcher";

afterEach(cleanup);

const memberships: OrganizationMembership[] = [
  { id: "0198f0b0-0000-7000-8000-000000000001", slug: "my-space", name: "Personal", kind: "personal", role: "owner" },
  { id: "0198f0b0-0000-7000-8000-000000000002", slug: "acme", name: "Acme", kind: "team", role: "owner" },
];

it("switches organizations and offers to create one", () => {
  render(<OrganizationSwitcher scope={{ kind: "organization", id: "0198f0b0-0000-7000-8000-000000000002" }} pathname="/org/acme/jobs" memberships={memberships} />);
  fireEvent.click(screen.getByRole("button", { name: "Acme, switch scope" }));
  expect(screen.getByRole("link", { name: "Personal" })).toHaveAttribute("href", "/org/my-space/jobs");
  expect(screen.getByRole("link", { name: "Acme" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "+ Create organization" })).toHaveAttribute("href", "/organizations#create-organization");
});

it("sends Personal settings to Account passkeys", () => {
  render(<OrganizationSwitcher scope={{ kind: "organization", id: "0198f0b0-0000-7000-8000-000000000002" }} pathname="/org/acme/settings" memberships={memberships} />);
  fireEvent.click(screen.getByRole("button", { name: "Acme, switch scope" }));
  expect(screen.getByRole("link", { name: "Personal" })).toHaveAttribute("href", "/account/passkeys");
});
