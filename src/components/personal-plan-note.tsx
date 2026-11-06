"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { LinkButton } from "@/components/ui";
import { currentUserOptions } from "@/lib/session";
import { planLabel } from "@/components/organization-switcher";
import { personalDestinationFromPath } from "@/lib/dashboard-routes";

export type PersonalPlanUsage = {
  enforced: boolean;
  plan: string;
  audits: { used: number; limit: number; remaining: number; periodEnd: string };
  schedules: { active: number; limit: number | null; minimumIntervalHours: number | null };
};

export function usePersonalPlanUsage() {
  const user = useQuery(currentUserOptions);
  return useQuery({
    queryKey: ["plan-usage", user.data?.id ?? "guest"],
    enabled: Boolean(user.data),
    queryFn: ({ signal }) => apiFetch<PersonalPlanUsage>("/api/account/plan-usage", { signal }),
  });
}

/** False only when the plan is known to allow no schedules. */
export function schedulesAllowed(usage: PersonalPlanUsage | undefined): boolean {
  return !usage?.enforced || (usage.schedules.limit ?? 0) > 0;
}

export function PersonalPlanNote({ kind }: { kind: "audits" | "schedules" }) {
  const pathname = usePathname();
  const usage = usePersonalPlanUsage();
  const data = usage.data;
  if (!data?.enforced) return null;
  const upgrade = <Link href={personalDestinationFromPath(pathname, "billing")} className="underline">Upgrade your plan</Link>;
  if (kind === "audits") {
    const resets = new Date(data.audits.periodEnd).toLocaleDateString();
    const { used, limit, remaining } = data.audits;
    return remaining > 0
      ? <div className="relative min-w-48 max-w-xs">
          <div className="flex items-center gap-2">
            <p className="text-sm text-ink-muted" role="status">{remaining} of {limit} audits left</p>
            <UsageDetails>
              <p>{used} of {limit} audits used this period. Resets {resets}.</p>
              <p className="mt-1">{planLabel(data.plan)}</p>
              <LinkButton href={personalDestinationFromPath(pathname, "billing")} variant="secondary" className="mt-3">Upgrade</LinkButton>
            </UsageDetails>
          </div>
          <div role="progressbar" aria-label="Audits used this period" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used} className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-accent" style={{ width: `${limit > 0 ? Math.min(100, (used / limit) * 100) : 100}%` }} />
          </div>
        </div>
      : <p className="rounded-[10px] border border-line p-4 text-sm" role="alert">You&apos;ve used all {data.audits.limit} audits this period. They reset {resets}. {upgrade} for more.</p>;
  }
  if (!schedulesAllowed(data)) {
    return <p className="rounded-[10px] border border-line p-4 text-sm" role="status">Your plan doesn&apos;t include scheduled audits. {upgrade} to add one.</p>;
  }
  return <p className="text-sm text-ink-muted" role="status">{data.schedules.active} of {data.schedules.limit} active schedules. Each runs at most every {data.schedules.minimumIntervalHours} hours.</p>;
}

/** Eye button that opens the details behind a short usage line. */
function UsageDetails({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (event.target instanceof Node && !wrapper.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return <div ref={wrapper} onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}>
    <button type="button" aria-label="Usage details" aria-expanded={open} aria-controls="usage-details" onClick={() => setOpen(value => !value)}
      className="grid h-6 w-6 place-items-center rounded-md text-ink-muted hover:bg-canvas-elevated hover:text-ink">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
      </svg>
    </button>
    {open && <div id="usage-details" className="absolute left-0 top-full z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-canvas-elevated p-4 text-sm shadow-lg">{children}</div>}
  </div>;
}
