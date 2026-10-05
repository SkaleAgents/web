import type { SwarmJob } from "@/lib/api";

type Result = Pick<SwarmJob, "status" | "partial" | "findings">;

export function AuditResultSummary({ job }: { job: Result }) {
  const active = job.status === "queued" || job.status === "running";
  const count = job.findings?.length;
  const title = active ? "Audit in progress"
    : job.status === "failed" ? "Audit could not finish"
      : count === undefined ? "Findings unavailable"
        : count === 0 ? "No findings recorded"
          : `${count} ${count === 1 ? "finding" : "findings"} to review`;
  const action = active ? "Wait for the audit to finish before deciding what to change. Results may still change."
    : job.status === "failed" ? "These results are incomplete. Review any findings below, then check the error and supply fresh input for another audit."
      : count === undefined ? "This report cannot tell whether issues were found. Check the audit status and try loading it again."
        : count === 0 ? "Read the check list below before deciding whether more checks are needed. No findings does not confirm that the infrastructure is secure or compliant."
          : "Read each issue and its recommended action below. Review critical and high severity findings first, and confirm the affected resource before making changes.";
  return <div>
    <h2 className="mt-2 text-xl font-semibold text-ink">{title}</h2>
    <p className="mt-3 max-w-3xl text-sm text-ink"><strong>What to do next: </strong>{action}</p>
    {!active && job.status !== "failed" && job.partial && <p className="mt-2 text-sm text-ink-muted">This audit has partial results. Some checks may be missing or incomplete.</p>}
  </div>;
}
