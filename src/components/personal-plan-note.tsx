"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
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
    return data.audits.remaining > 0
      ? <p className="text-sm text-ink-muted" role="status">{data.audits.remaining} of {data.audits.limit} audits left this period. Resets {resets}.</p>
      : <p className="rounded-[10px] border border-line p-4 text-sm" role="alert">You&apos;ve used all {data.audits.limit} audits this period. They reset {resets}. {upgrade} for more.</p>;
  }
  if (!schedulesAllowed(data)) {
    return <p className="rounded-[10px] border border-line p-4 text-sm" role="status">Your plan doesn&apos;t include scheduled audits. {upgrade} to add one.</p>;
  }
  return <p className="text-sm text-ink-muted" role="status">{data.schedules.active} of {data.schedules.limit} active schedules. Each runs at most every {data.schedules.minimumIntervalHours} hours.</p>;
}
