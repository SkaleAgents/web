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
  expect(screen.getByRole("link", { name: "Personal" })).toHaveAttribute("href", `/org/${memberships[0].id}/jobs`);
  expect(screen.getByRole("link", { name: "Acme" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "+ Create organization" })).toHaveAttribute("href", "/organizations#create-organization");
});

it("sends Personal settings to Account passkeys", () => {
  render(<OrganizationSwitcher scope={{ kind: "organization", id: "0198f0b0-0000-7000-8000-000000000002" }} pathname="/org/acme/settings" memberships={memberships} />);
  fireEvent.click(screen.getByRole("button", { name: "Acme, switch scope" }));
  expect(screen.getByRole("link", { name: "Personal" })).toHaveAttribute("href", "/account/passkeys");
});

it("shows the plan under each organization name", () => {
  const withPlans = [{ ...memberships[0], plan: "free" }, { ...memberships[1], plan: "pro" }];
  render(<OrganizationSwitcher scope={{ kind: "organization", id: memberships[1].id }} pathname="/org/acme/jobs" memberships={withPlans} />);
  const trigger = screen.getByRole("button", { name: "Acme, switch scope" });
  expect(trigger).toHaveTextContent("Pro plan");
  fireEvent.click(trigger);
  expect(screen.getByRole("link", { name: /^Personal\s*Free plan$/ })).toBeVisible();
});

it("shows no plan line when the API sends none", () => {
  render(<OrganizationSwitcher scope={{ kind: "organization", id: memberships[1].id }} pathname="/org/acme/jobs" memberships={memberships} />);
  expect(screen.getByRole("button", { name: "Acme, switch scope" })).not.toHaveTextContent("plan");
});

it("offers a small Upgrade link to owners on a plan that can be upgraded", () => {
  const withPlans = [{ ...memberships[0], plan: "free" }, { ...memberships[1], plan: "pro" }];
  render(<OrganizationSwitcher scope={{ kind: "organization", id: memberships[1].id }} pathname="/org/acme/jobs" memberships={withPlans} />);
  expect(screen.getByRole("link", { name: "Upgrade" })).toHaveAttribute("href", `/org/${memberships[1].id}/billing`);
});

it("hides Upgrade on the top plan, for non-owners and when the plan is unknown", () => {
  const scope = { kind: "organization" as const, id: memberships[1].id };
  const { rerender } = render(<OrganizationSwitcher scope={scope} pathname="/org/acme/jobs" memberships={[memberships[0], { ...memberships[1], plan: "max" }]} />);
  expect(screen.queryByRole("link", { name: "Upgrade" })).toBeNull();
  rerender(<OrganizationSwitcher scope={scope} pathname="/org/acme/jobs" memberships={[memberships[0], { ...memberships[1], plan: "free", role: "member" }]} />);
  expect(screen.queryByRole("link", { name: "Upgrade" })).toBeNull();
  rerender(<OrganizationSwitcher scope={scope} pathname="/org/acme/jobs" memberships={memberships} />);
  expect(screen.queryByRole("link", { name: "Upgrade" })).toBeNull();
});
