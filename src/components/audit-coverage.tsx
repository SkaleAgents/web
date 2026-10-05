import { checkLabel, checksWithStatus, checkTitle, evaluatedClearChecks, reasonLabels, skippedChecks, specialistLabels, type AuditCoverage, type CoverageTask } from "@/lib/audit-coverage";

export function ClearCheckSummary({ coverage, tasks = [] }: { coverage?: AuditCoverage; tasks?: CoverageTask[] }) {
  const checks = evaluatedClearChecks(coverage, tasks);
  if (checks.length === 0) return null;
  const shown = checks.slice(0, 12);
  const more = checks.length - shown.length;
  return <div className="space-y-2">
    <p className="text-sm text-ink">These checks ran and found nothing.</p>
    <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
      {shown.map((check) => <li key={check.id}>{check.title}</li>)}
    </ul>
    {more > 0 && <p className="text-xs text-ink-muted">{more} more ran.</p>}
  </div>;
}

export function SkippedCheckList({ coverage, tasks = [] }: { coverage?: AuditCoverage; tasks?: CoverageTask[] }) {
  const skipped = skippedChecks(coverage, tasks);
  if (skipped.length === 0) return null;
  const shown = skipped.slice(0, 8);
  return <div className="space-y-2">
    <h3 className="text-sm font-semibold text-ink">Skipped checks</h3>
    <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
      {shown.map((check) => <li key={check.id}>{check.label}. {check.reason}</li>)}
    </ul>
    {skipped.length > shown.length && <p className="text-xs text-ink-muted">{skipped.length - shown.length} more skipped checks are listed in check coverage.</p>}
  </div>;
}

export function PlainCheckList({ coverage, tasks = [], status }: { coverage?: AuditCoverage; tasks?: CoverageTask[]; status: string }) {
  const pending = status === "queued" || status === "running";
  const checked = checksWithStatus(coverage, tasks, "evaluated");
  const skipped = skippedChecks(coverage, tasks);
  const failed = checksWithStatus(coverage, tasks, "failed");
  const recorded = Boolean(coverage?.ruleLevelChecksAvailable) || checked.length + skipped.length + failed.length > 0;
  const shown = <T,>(items: T[]) => items.slice(0, 8);
  return <section className="audit-check-list" aria-label="What was checked">
    <h2>What was checked</h2>
    {pending ? <p>Checks are still running.</p> : !recorded ? <p>This audit did not record which checks ran or which were skipped.</p> : <>
      <h3>Checked</h3>
      {checked.length === 0 ? <p>No completed checks were recorded.</p> : <ul>{shown(checked).map((check) => <li key={check.id}>{check.title}</li>)}</ul>}
      {checked.length > 8 && <p>{checked.length - 8} more completed checks are in Advanced.</p>}
      <h3>Not checked</h3>
      {skipped.length === 0 ? <p>No skipped checks were recorded.</p> : <ul>{shown(skipped).map((check) => <li key={check.id}>{check.label}. {check.reason}</li>)}</ul>}
      {skipped.length > 8 && <p>{skipped.length - 8} more skipped checks are in Advanced.</p>}
      {failed.length > 0 && <>
        <h3>Could not finish</h3>
        <ul>{shown(failed).map((check) => <li key={check.id}>{check.title}</li>)}</ul>
      </>}
    </>}
  </section>;
}

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
    {rows.map(task => <details key={task.specialist} className="border-t border-line pt-3" open={task.checkCoverage?.checks.some((check) => check.status === "skipped") || undefined}>
      <summary className="cursor-pointer text-sm font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-4">{specialistLabels[task.specialist] ?? "Specialist"}</summary>
      {task.checkCoverage?.version === "builtin-coverage-v1" ? <ul className="mt-3 space-y-3">
        {task.checkCoverage.checks.map(check => <li key={check.ruleId} className="text-sm">
          <p className="font-medium text-ink">{checkTitle(check) || "Unrecognized check"}</p>
          <p className="text-ink-muted">{checkLabel(check)}</p>
          {check.findingCount > 0 && <p className="text-ink-muted">{check.findingCount} {check.findingCount === 1 ? "finding" : "findings"}</p>}
          {check.reasonCodes.map(reason => <p key={reason} className="text-xs text-ink-muted">{reasonLabels[reason] ?? "Check details unavailable"}</p>)}
        </li>)}
      </ul> : <p className="mt-2 text-sm text-ink-muted">{pending(task.status) ? "Awaiting results" : "Check details unavailable"}</p>}
    </details>)}
    <p className="text-xs text-ink-muted">These checks review supplied input. No findings does not confirm that the infrastructure is secure or compliant.</p>
  </section>;
}
