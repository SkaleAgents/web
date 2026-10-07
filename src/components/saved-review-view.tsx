export type SavedReviewFinding = {
  severity: string;
  title: string;
  detail?: string;
  resource?: string;
  remediation?: string;
  path?: string;
  line?: number;
};

export type SavedReviewBody = {
  headline: string;
  riskSentence: string;
  findings: SavedReviewFinding[];
  moreFindings: number;
  checked: string[];
  skipped: string[];
};

export function SavedReviewView({ review }: { review: SavedReviewBody }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold">SkaleAgents review</p>
        <h1 className="text-3xl font-semibold tracking-tight">{review.headline}</h1>
        <p className="text-lg">{review.riskSentence}</p>
      </header>
      <section aria-label="Findings" className="flex flex-col gap-4">
        {review.findings.map((finding, index) => (
          <article key={`${finding.title}-${index}`} className="flex flex-col gap-2 border-t border-line pt-4">
            <p className="text-sm font-semibold uppercase">{finding.severity}</p>
            <h2 className="text-xl font-semibold">{finding.title}</h2>
            {finding.resource ? <p>Resource: {finding.resource}</p> : null}
            {finding.path ? <p>Path: {finding.path}{finding.line ? `:${finding.line}` : ""}</p> : null}
            {finding.detail ? <p>{finding.detail}</p> : null}
            {finding.remediation ? <p>Change: {finding.remediation}</p> : null}
          </article>
        ))}
        {review.moreFindings > 0 ? <p>{review.moreFindings} more findings.</p> : null}
        {review.findings.length === 0 ? <p>No findings. That does not prove the system is secure.</p> : null}
      </section>
      <section aria-label="Checked" className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Checked</h2>
        <ul>{review.checked.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <section aria-label="Skipped" className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Skipped</h2>
        <ul>{review.skipped.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
    </main>
  );
}
