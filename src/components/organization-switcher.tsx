"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { organizationHref, type DashboardScope } from "@/lib/dashboard-routes";
import { Avatar } from "@/components/avatar";

export type OrganizationMembership = {
  id: string;
  slug?: string | null;
  name: string;
  role: "owner" | "member" | "viewer";
  kind: "personal" | "team";
  plan?: string;
};

// Max and custom plans have nothing higher to buy, and only owners can change a plan.
const upgradablePlans = ["free", "starter", "pro"];

export function planLabel(plan?: string): string {
  return plan ? `${plan.charAt(0).toUpperCase()}${plan.slice(1)} plan` : "";
}

export function OrganizationSwitcher({ scope, pathname, memberships }: {
  scope: DashboardScope;
  pathname: string;
  memberships: OrganizationMembership[];
}) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const label = scope.kind === "organization" ? memberships.find(item => item.id === scope.id)?.name ?? "Organization" : "Organization";
  const current = scope.kind === "organization" ? memberships.find(item => item.id === scope.id) : null;
  const avatar = (item: OrganizationMembership) => <Avatar name={item.name} kind="team" className="scope-avatar" />;
  const section = pathname.match(/^\/org\/[^/]+\/([^/]+)/)?.[1] ?? "";
  const targetPath = (item: OrganizationMembership) => {
    if (!section || (item.kind === "team" && !["jobs", "schedules", "settings"].includes(section))) return organizationHref(item);
    if (section === "settings" && item.kind === "personal") return "/account/passkeys";
    return organizationHref(item, section);
  };

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !wrapper.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  return <div className="scope-switcher" ref={wrapper} onKeyDown={event => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    }
  }}>
    {current && avatar(current)}
    <div className="scope-switcher-main">
      <button ref={trigger} type="button" className="scope-switcher-trigger"
        aria-label={`${label}, switch scope`} aria-expanded={open} aria-controls="scope-switcher-options"
        onClick={() => setOpen(value => !value)}>
        <span className="truncate">{label}</span>
      </button>
      {current?.plan && <div className="scope-plan-row">
        <span className="scope-plan">{planLabel(current.plan)}</span>
        {current.role === "owner" && upgradablePlans.includes(current.plan) &&
          <Link href={organizationHref(current, "billing")} className="scope-upgrade">Upgrade</Link>}
      </div>}
    </div>
    {open && <div id="scope-switcher-options" className="scope-switcher-options" aria-label="Choose scope">
      {memberships.map(item => <Link key={item.id} href={targetPath(item)}
        aria-current={current?.id === item.id ? "page" : undefined}
        onClick={() => setOpen(false)}>{avatar(item)}<span className="scope-switcher-text"><span className="truncate">{item.name}</span>{item.plan && <span className="scope-plan">{planLabel(item.plan)}</span>}</span></Link>)}
      <Link href="/organizations#create-organization" className="scope-switcher-create" onClick={() => setOpen(false)}>+ Create organization</Link>
    </div>}
  </div>;
}
