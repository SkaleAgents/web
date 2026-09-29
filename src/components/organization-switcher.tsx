"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { type DashboardScope, switchScopePath } from "@/lib/dashboard-routes";

export type OrganizationMembership = {
  id: string;
  name: string;
  role: "owner" | "member" | "viewer";
};

export function OrganizationSwitcher({ scope, pathname, memberships }: {
  scope: DashboardScope;
  pathname: string;
  memberships: OrganizationMembership[];
}) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const label = scope.kind === "personal" ? "Personal" : memberships.find(item => item.id === scope.id)?.name ?? "Organization";

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
    <button ref={trigger} type="button" className="scope-switcher-trigger"
      aria-label={`${label}, switch scope`} aria-expanded={open} aria-controls="scope-switcher-options"
      onClick={() => setOpen(value => !value)}>
      <span className="truncate">{label}</span>
    </button>
    {open && <div id="scope-switcher-options" className="scope-switcher-options" aria-label="Choose scope">
      <Link href={switchScopePath(pathname, { kind: "personal" })} aria-current={scope.kind === "personal" ? "page" : undefined}
        onClick={() => setOpen(false)}>Personal</Link>
      {memberships.map(item => <Link key={item.id} href={switchScopePath(pathname, { kind: "organization", id: item.id })}
        aria-current={scope.kind === "organization" && scope.id === item.id ? "page" : undefined}
        onClick={() => setOpen(false)}>{item.name}</Link>)}
    </div>}
  </div>;
}
