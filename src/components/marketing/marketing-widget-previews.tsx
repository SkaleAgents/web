import { Button, LinkButton } from "@/components/ui";
import { examples } from "@/components/marketing/example-data";
import { goals } from "@/components/marketing/start-picker-data";
import { ORIGINAL_SAMPLE, reviewSample } from "@/lib/sample-review";

export function ExampleExplorerPreview() {
  const example = examples[0];

  return (
    <div className="example-explorer mt-9" data-playing="false">
      <div className="grid items-start gap-6 lg:grid-cols-[190px_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-6">
          <div className="mb-4 flex items-center justify-between gap-2 lg:block">
            <p className="marketing-eyebrow example-auto-label">Auto preview / 9 seconds</p>
            <p className="marketing-eyebrow example-manual-label">Choose a review</p>
            <button type="button" disabled className="example-rotation-toggle rounded px-2 py-1 text-xs text-ink-muted lg:mt-3"><span aria-hidden="true" className="mr-2">Ⅱ</span>Pause examples</button>
          </div>
          <fieldset disabled>
            <legend className="sr-only">Choose a review example</legend>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-3">
              {examples.map((item, index) => (
                <label key={item.id} className="relative min-w-0 cursor-pointer">
                  <input type="radio" name="review-example" value={item.id} aria-label={item.label} checked={index === 0} readOnly className="peer sr-only" />
                  <span className="relative block overflow-hidden rounded-[6px] border border-line px-4 py-4 text-sm text-ink-muted peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-ink">
                    <span className="block font-semibold">{item.label}</span>
                    <span className="mt-1 block font-mono text-[10px] uppercase tracking-wide" aria-hidden="true">0{index + 1} / {item.specialty}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="example-auto-label mt-4 hidden text-xs leading-relaxed text-ink-muted lg:block">Pauses while you hover, focus, or read a prompt. Pick any topic to explore it.</p>
        </div>

        <div className="min-w-0 overflow-hidden rounded-[10px] border border-line bg-canvas-elevated lg:grid lg:min-h-[48rem] lg:grid-rows-[auto_1fr_auto]" role="region" aria-label={`${example.label} example`}>
          <div className="border-b border-line p-6 sm:p-8 lg:min-h-[15rem]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="marketing-eyebrow">{example.specialty} / review brief</p>
              <span className="rounded border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-muted">Illustrative example</span>
            </div>
            <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{example.title}</h3>
            <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">{example.description}</p>
          </div>
          <div className="grid lg:min-h-[22rem] lg:grid-cols-2">
            <div className="min-w-0 border-b border-line bg-canvas p-6 sm:p-8 lg:border-r lg:border-b-0">
              <p className="marketing-eyebrow">01 / What you bring</p>
              <p className="mt-5 font-mono text-xs text-ink-muted">{example.filename}</p>
              <pre className="mt-4 overflow-x-auto font-mono text-xs leading-7 sm:text-sm"><code>{example.input}</code></pre>
            </div>
            <div className="p-6 sm:p-8">
              <p className="marketing-eyebrow">02 / What a review looks like</p>
              <h4 className="mt-5 text-lg font-semibold">{example.finding}</h4>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{example.evidence}</p>
              {example.proposal && <div className="mt-6 border-l-2 border-accent pl-4"><p className="text-sm font-semibold">Public database</p><p className="mt-2 font-mono text-xs leading-7 text-ink-muted sm:text-sm">{example.proposal}</p></div>}
              <div className="mt-6 border-l-2 border-accent pl-4"><p className="text-sm font-semibold">Suggested next step</p><p className="mt-2 text-sm leading-relaxed text-ink-muted">{example.fix}</p></div>
            </div>
          </div>
          <div className="border-t border-line p-6 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="max-w-md text-sm text-ink-muted">Try this approach with your own context. These examples are not live audit results.</p>
              <Button type="button" variant="secondary" disabled>Copy starter prompt</Button>
            </div>
            <p role="status" className="mt-2 text-sm text-ink-muted" />
            <details className="mt-2 text-sm"><summary className="w-fit cursor-pointer py-2 font-semibold underline decoration-line underline-offset-4">Read or customize the prompt</summary></details>
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end"><LinkButton href="/dashboard/jobs" variant="ghost">Bring your own infrastructure to an audit <span aria-hidden="true" className="ml-2">↗</span></LinkButton></div>
    </div>
  );
}

export function SampleReviewDemoPreview() {
  const review = reviewSample(ORIGINAL_SAMPLE);
  if (review.error !== null) return null;

  return (
    <>
      <p className="marketing-eyebrow">Try it yourself / No account needed</p>
      <h2 id="sample-demo-heading" className="marketing-heading">Change a setting.<br />See why it matters.</h2>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-muted">Edit the simplified deployment settings below. Three local rules update the sample findings as you type. This is an interactive example, not a live AI audit or a deployable manifest.</p>
      <div className="mt-8 grid overflow-hidden rounded-[10px] border border-line bg-canvas-elevated lg:grid-cols-2">
        <div className="min-w-0 border-b border-line p-6 sm:p-8 lg:border-r lg:border-b-0">
          <div className="flex flex-wrap items-center justify-between gap-3"><label htmlFor="sample-settings" className="text-sm font-semibold">Sample deployment settings (JSON)</label><span className="font-mono text-[10px] uppercase tracking-wide text-ink-muted">Runs in your browser</span></div>
          <textarea id="sample-settings" defaultValue={ORIGINAL_SAMPLE} disabled spellCheck={false} maxLength={4000} rows={8} aria-describedby="sample-settings-hint" aria-invalid={false} className="mt-4 w-full resize-y rounded-md border border-line bg-canvas p-4 font-mono text-sm leading-7 text-ink" />
          <p id="sample-settings-hint" className="mt-3 text-sm leading-relaxed text-ink-muted">Try <code>replicas: 2</code>, turn <code>readinessProbe</code> on, or set <code>memoryLimitMi</code> to a positive number.</p>
          <div className="mt-5 flex flex-wrap gap-2"><Button type="button" disabled>Apply example improvements</Button><Button type="button" variant="secondary" disabled>Reset sample</Button></div>
          <details className="mt-6 text-sm"><summary className="w-fit cursor-pointer py-2 font-semibold underline decoration-line underline-offset-4">What does this demo check?</summary><ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed text-ink-muted"><li>Whether at least two replicas are configured.</li><li>Whether the readiness-probe setting is enabled.</li><li>Whether a positive memory limit is supplied in Mi.</li></ul><p className="mt-3 leading-relaxed text-ink-muted">The example improvements illustrate these rules. Real values depend on your workload. No code is executed or sent to an API.</p></details>
        </div>
        <div className="min-w-0 p-6 sm:p-8" aria-live="polite" aria-atomic="true">
          <p className="marketing-eyebrow">Sample findings</p>
          <h3 className="mt-3 text-xl font-semibold">0 of 3 sample checks configured</h3>
          <div className="mt-4 flex gap-1.5" aria-hidden="true">{review.findings.map((finding) => <span key={finding.field} className={`h-1.5 flex-1 rounded-full ${finding.configured ? "bg-accent" : "bg-line"}`} />)}</div>
          <ul className="mt-5 divide-y divide-line">{review.findings.map((finding) => <li key={finding.field} className="py-4 first:pt-0"><div className="flex flex-wrap items-center justify-between gap-2"><code className="text-xs text-ink-muted">{finding.field}</code><span className="rounded border border-line px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Review this</span></div><h4 className="mt-2 font-semibold">{finding.title}</h4><p className="mt-2 text-sm leading-relaxed text-ink-muted">{finding.detail}</p></li>)}</ul>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4"><div><Button type="button" variant="secondary" disabled>Copy demo settings</Button><p className="mt-2 text-xs text-ink-muted" aria-live="polite" /></div><LinkButton href="/dashboard/jobs" variant="ghost">Review your own infrastructure <span className="ml-2" aria-hidden="true">↗</span></LinkButton></div>
    </>
  );
}

export function StartPickerPreview() {
  return (
    <div className="rounded-[10px] border border-line bg-accent-soft p-6 sm:p-10">
      <p className="marketing-eyebrow">Your next step</p>
      <h2 id="next-step-heading" className="marketing-heading">Find your starting point.</h2>
      <p className="mt-4 max-w-xl leading-relaxed text-ink-muted">Two choices. A suggested workflow. Explore the options here before opening the app.</p>
      <fieldset className="mt-8" disabled>
        <legend className="mb-4 text-sm font-semibold">1. What would you like to do?</legend>
        <div className="grid gap-3 sm:grid-cols-3">{goals.map((item) => <label key={item.id} className="cursor-pointer"><input type="radio" name="starting-goal" aria-label={item.label} className="peer sr-only" /><span className="block h-full rounded-lg border border-line bg-canvas-elevated p-4"><span className="block font-semibold">{item.label}</span><span className="mt-2 block text-sm leading-relaxed text-ink-muted">{item.description}</span></span></label>)}</div>
      </fieldset>
    </div>
  );
}
