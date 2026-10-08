"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, type SwarmSchedule } from "@/lib/api";
import { Button, LinkButton } from "@/components/ui";
import { currentUserOptions } from "@/lib/session";
import { personalDestinationFromPath } from "@/lib/dashboard-routes";
import { scheduleCadenceLabel } from "@/lib/schedule-cadence";

export default function SchedulesPage() {
  const pathname = usePathname();
  const href = (section: string) => personalDestinationFromPath(pathname, section);
  const user = useQuery(currentUserOptions);
  const schedules = useQuery({
    queryKey: ["swarm-schedules", user.data?.id ?? "guest"],
    enabled: Boolean(user.data),
    queryFn: async ({ signal }) => (await apiFetch<{ schedules: SwarmSchedule[] }>("/api/schedules", { signal })).schedules,
  });

  return (
    <main className="space-y-8">
      <div className="workspace-intro flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="workspace-kicker">Review / Make it repeatable</p>
          <h1 className="workspace-heading">Scheduled audits</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">Recurring reviews of saved infrastructure text or a public GitHub file.</p>
        </div>
        <LinkButton href={href("schedules/new")}>Add schedule</LinkButton>
      </div>

      {(user.isPending || user.data && schedules.isPending) && <p className="text-sm text-ink-muted">Loading schedules…</p>}
      {!user.isPending && !user.data && <p className="text-sm text-ink-muted">Use Sign in in the header to manage your schedules.</p>}
      {user.data && schedules.isError && (
        <div className="rounded-[10px] border border-line p-4" role="alert">
          <p className="text-sm text-danger">{schedules.error.message}</p>
          <p className="mt-2 text-sm text-ink-muted">Could not load schedules. Try again.</p>
          <Button type="button" variant="secondary" className="mt-3" onClick={() => void schedules.refetch()}>Try again</Button>
        </div>
      )}
      {schedules.data?.length === 0 && <div className="rounded-xl border border-dashed border-line p-6 text-sm text-ink-muted"><p>No schedules yet. Add one when you want a review to repeat.</p><LinkButton href={href("schedules/new")} className="mt-4">Add schedule</LinkButton></div>}
      {schedules.data && schedules.data.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold" scope="col">Name</th>
                <th className="px-4 py-3 font-semibold" scope="col">Cadence</th>
                <th className="px-4 py-3 font-semibold" scope="col">Status</th>
                <th className="px-4 py-3 font-semibold" scope="col">Next run</th>
              </tr>
            </thead>
            <tbody>
              {schedules.data.map((schedule) => (
                <tr key={schedule.id} className="border-t border-line">
                  <td className="px-4 py-4 font-medium">
                    <Link href={href(`schedules/${schedule.id}`)} className="hover:underline">{schedule.name}</Link>
                  </td>
                  <td className="px-4 py-4 text-ink-muted">{scheduleCadenceLabel(schedule.cronExpression)}</td>
                  <td className="px-4 py-4 text-ink-muted">{schedule.enabled ? "Active" : "Paused"}</td>
                  <td className="px-4 py-4 text-ink-muted">{schedule.enabled && schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleString() : "Not scheduled"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
