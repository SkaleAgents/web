"use client";

import { useState } from "react";
import { Button, LinkButton } from "@/components/ui";
import { IMPROVED_SAMPLE, ORIGINAL_SAMPLE, reviewSample } from "@/lib/sample-review";

export function SampleReviewDemo() {
  const [source, setSource] = useState(ORIGINAL_SAMPLE);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const review = reviewSample(source);
  const configured = review.findings?.filter((finding) => finding.configured).length ?? 0;

  function updateSource(value: string) {
    setSource(value);
    setCopyState("idle");
  }

  async function copySettings() {
    try {
      await navigator.clipboard.writeText(source);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <>
      <p className="marketing-eyebrow">Try it yourself / No account needed</p>
      <h2 id="sample-demo-heading" className="marketing-heading">Change a setting.<br />See why it matters.</h2>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-muted">Edit the simplified deployment settings below. Three local rules update the sample findings as you type. This is an interactive example, not a live AI audit or a deployable manifest.</p>

      <div className="mt-8 grid overflow-hidden rounded-[10px] border border-line bg-canvas-elevated lg:grid-cols-2">
        <div className="min-w-0 border-b border-line p-6 sm:p-8 lg:border-r lg:border-b-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="sample-settings" className="text-sm font-semibold">Sample deployment settings (JSON)</label>
            <span className="font-mono text-[10px] uppercase tracking-wide text-ink-muted">Runs in your browser</span>
          </div>
          <textarea
            id="sample-settings"
            value={source}
            onChange={(event) => updateSource(event.target.value)}
            spellCheck={false}
            maxLength={4000}
            rows={8}
            aria-describedby="sample-settings-hint"
            aria-invalid={Boolean(review.error)}
            className="mt-4 w-full resize-y rounded-md border border-line bg-canvas p-4 font-mono text-sm leading-7 text-ink"
          />
          <p id="sample-settings-hint" className="mt-3 text-sm leading-relaxed text-ink-muted">Try <code>replicas: 2</code>, turn <code>readinessProbe</code> on, or set <code>memoryLimitMi</code> to a positive number.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" onClick={() => updateSource(IMPROVED_SAMPLE)}>Apply example improvements</Button>
            <Button type="button" variant="secondary" onClick={() => updateSource(ORIGINAL_SAMPLE)}>Reset sample</Button>
          </div>
          <details className="mt-6 text-sm">
            <summary className="w-fit cursor-pointer py-2 font-semibold underline decoration-line underline-offset-4">What does this demo check?</summary>
            <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed text-ink-muted">
              <li>Whether at least two replicas are configured.</li>
              <li>Whether the readiness-probe setting is enabled.</li>
              <li>Whether a positive memory limit is supplied in Mi.</li>
            </ul>
            <p className="mt-3 leading-relaxed text-ink-muted">The example improvements illustrate these rules. Real values depend on your workload. No code is executed or sent to an API.</p>
          </details>
        </div>

        <div className="min-w-0 p-6 sm:p-8" aria-live="polite" aria-atomic="true">
          <p className="marketing-eyebrow">Sample findings</p>
          {review.error !== null ? (
            <div className="mt-5 rounded-lg border border-danger/40 bg-canvas p-5">
              <h3 className="font-semibold">Check the sample format</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{review.error}</p>
              <p className="mt-3 text-xs text-ink-muted">Findings update once the three settings are valid.</p>
            </div>
          ) : (
            <>
              <h3 className="mt-3 text-xl font-semibold">{configured} of 3 sample checks configured</h3>
              <div className="mt-4 flex gap-1.5" aria-hidden="true">
                {review.findings.map((finding) => <span key={finding.field} className={`h-1.5 flex-1 rounded-full ${finding.configured ? "bg-accent" : "bg-line"}`} />)}
              </div>
              <ul className="mt-5 divide-y divide-line">
                {review.findings.map((finding) => (
                  <li key={finding.field} className="py-4 first:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <code className="text-xs text-ink-muted">{finding.field}</code>
                      <span className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${finding.configured ? "bg-accent-soft text-ink" : "border border-line text-ink-muted"}`}>{finding.configured ? "Configured" : "Review this"}</span>
                    </div>
                    <h4 className="mt-2 font-semibold">{finding.title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{finding.detail}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button type="button" variant="secondary" disabled={Boolean(review.error)} onClick={() => void copySettings()}>Copy demo settings</Button>
          <p className="mt-2 text-xs text-ink-muted" aria-live="polite">{copyState === "copied" ? "Demo settings copied." : copyState === "failed" ? "Clipboard unavailable. Select and copy the JSON in the editor." : ""}</p>
        </div>
        <LinkButton href="/jobs" variant="ghost">Review your own infrastructure <span className="ml-2" aria-hidden="true">↗</span></LinkButton>
      </div>
    </>
  );
}
