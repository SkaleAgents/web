import { checkLabel, checkLabels, reasonLabels, specialistLabels, type AuditCoverage, type CoverageTask } from "@/lib/audit-coverage";

export function AuditCoveragePanel({ coverage, tasks = [], status }: {
  coverage?: AuditCoverage;
  tasks?: CoverageTask[];
  status: string;
}) {
  const recorded = coverage?.ruleLevelChecksAvailable;
  const rows = coverage?.tasks ?? tasks;
  const pending = (value: string) => value === "queued" || value === "running";
  return <section className="audit-coverage space-y-3 rounded-[10px] border border-line p-4" aria-label="Check coverage">
    <h3 className="text-sm font-semibold text-ink">Check coverage</h3>
    {!recorded && !pending(status) && <p className="coverage-notice">Check details weren’t recorded for this audit. Its findings are still available, but individual checks can’t be reconstructed.</p>}
    {recorded && coverage && <div className="text-sm text-ink">
      <p>{coverage.counts.evaluated} evaluated · {coverage.counts.skipped} skipped · {coverage.counts.failed} failed</p>
      {coverage.counts.partial > 0 && <p className="mt-1 text-ink-muted">{coverage.counts.partial} evaluated {coverage.counts.partial === 1 ? "check has" : "checks have"} partial coverage.</p>}
      {coverage.tasksWithoutCoverage > 0 && <p className="mt-1 text-ink-muted">Check details are missing for {coverage.tasksWithoutCoverage} {coverage.tasksWithoutCoverage === 1 ? "specialist" : "specialists"}.</p>}
    </div>}
    {rows.length === 0 && <p className="text-sm text-ink-muted">{pending(status) ? "Awaiting results" : "Check details unavailable"}</p>}
    {rows.map(task => <details key={task.specialist} className="border-t border-line pt-3">
      <summary className="cursor-pointer text-sm font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-4">{specialistLabels[task.specialist] ?? "Specialist"}</summary>
      {task.checkCoverage?.version === "builtin-coverage-v1" ? <ul className="mt-3 space-y-3">
        {task.checkCoverage.checks.map(check => <li key={check.ruleId} className="text-sm">
          <p className="font-medium text-ink">{checkLabels[check.ruleId] ?? "Unrecognized check"}</p>
          <p className="text-ink-muted">{checkLabel(check)}</p>
          {check.findingCount > 0 && <p className="text-ink-muted">{check.findingCount} {check.findingCount === 1 ? "finding" : "findings"}</p>}
          {check.reasonCodes.map(reason => <p key={reason} className="text-xs text-ink-muted">{reasonLabels[reason] ?? "Check details unavailable"}</p>)}
        </li>)}
      </ul> : <p className="mt-2 text-sm text-ink-muted">{pending(task.status) ? "Awaiting results" : "Check details unavailable"}</p>}
    </details>)}
    <p className="text-xs text-ink-muted">These checks review supplied input. No findings does not confirm that the infrastructure is secure or compliant.</p>
  </section>;
}
