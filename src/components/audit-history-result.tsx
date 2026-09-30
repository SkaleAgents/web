import type { SwarmJob } from "@/lib/api";

type HistoryResult = Pick<SwarmJob, "status" | "partial" | "findingSummary">;

export function AuditHistoryResult({ job }: { job: HistoryResult }) {
  if (job.status === "queued" || job.status === "running") {
    return <p className="mt-1 text-sm font-semibold text-ink">{job.status === "queued" ? "Waiting to start" : "Audit in progress"}</p>;
  }
  const incomplete = job.status === "failed" || job.partial;
  const summary = job.findingSummary;
  const count = summary?.total;
  const severity = summary?.highestSeverity;
  const label = incomplete ? "Incomplete results"
    : count === undefined ? "Findings unavailable"
      : count === 0 ? "No findings"
        : `${count} ${count === 1 ? "finding" : "findings"}`;
  return <div className="mt-1 space-y-1">
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-sm font-semibold text-ink">{label}</p>
      {count !== undefined && count > 0 && severity && <span className="finding-severity" data-severity={severity}>{severity[0].toUpperCase() + severity.slice(1)} severity</span>}
    </div>
    {incomplete && <p className="text-xs text-ink-muted">{count === undefined ? "Finding count unavailable" : `${count} ${count === 1 ? "finding" : "findings"} recorded`}</p>}
    {!incomplete && count === 0 && <p className="text-xs text-ink-muted">Review coverage limits</p>}
  </div>;
}
