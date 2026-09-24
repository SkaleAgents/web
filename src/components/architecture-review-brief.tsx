"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui";

const reviewQuestions = {
  "Whole application": "Does this application's architecture fit its purpose and constraints? Review routing and rendering, module boundaries, data access, authorization, failure handling, testing, and deployment.",
  "Server and client": "Are the Next.js server/client boundaries and rendering choices appropriate? Trace imports and explain where fetching, secrets, and interactive state belong.",
  "Data and authorization": "Trace a critical request from the UI through the API and storage layer. Check where input validation, object ownership, tenant isolation, and safe return values are enforced.",
  "Reliability and delivery": "Review dependency failures, runtime compatibility, recovery, critical-flow tests, and deployment. Compare recommendations against the team's budget and operating capacity.",
} as const;
type ReviewTopic = keyof typeof reviewQuestions;

export function ArchitectureReviewBrief() {
  const [topic, setTopic] = useState<ReviewTopic>("Whole application");
  const [context, setContext] = useState("");
  const prompt = `Act as an independent architecture consultant using SkaleAgents.\n\n${reviewQuestions[topic]}${context.trim() ? `\n\nProject context: ${context.trim()}` : ""}\n\nStart with plan_architecture_review using this repository's file inventory. Read the relevant files, including package.json and tsconfig.json, then call review_application_architecture. Ask me up to three follow-up questions at a time and carry my answers forward in context. Explain what is sound, what needs changes, and what needs more evidence, with file references and practical alternatives.`;
  async function copy() {
    try { await navigator.clipboard.writeText(prompt); toast.success("Review brief copied"); }
    catch { toast.error("Could not copy. Select the review brief manually."); }
  }
  return (
    <section className="space-y-5 rounded-lg border border-line bg-canvas-elevated p-4 sm:p-5" aria-labelledby="architecture-review-heading">
      <div><h3 id="architecture-review-heading" className="text-lg font-semibold">Review the whole application</h3><p className="mt-2 text-sm leading-relaxed text-ink-muted">Give your connected assistant a review brief. It reads the relevant files, uses SkaleAgents to check the structure, and asks about the decisions behind your design.</p></div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Architecture review focus">
        {(Object.keys(reviewQuestions) as ReviewTopic[]).map(name => <button key={name} type="button" className="filter-chip" aria-pressed={topic === name} onClick={() => setTopic(name)}>{name}</button>)}
      </div>
      <div className="space-y-2"><label htmlFor="architecture-review-context" className="block text-sm font-medium">What does the application do?</label><textarea id="architecture-review-context" rows={3} maxLength={2000} value={context} onChange={event => setContext(event.target.value)} placeholder="For example: a Next.js customer portal with a separate API, private project data, and a two-person team." className="w-full rounded-lg border border-line bg-canvas p-3 text-sm text-ink" /><p className="text-xs text-ink-muted">Optional. Add the important user flows or a design decision you want challenged.</p></div>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-canvas p-4 font-mono text-xs leading-relaxed" aria-label="Architecture review brief">{prompt}</pre>
      <Button type="button" variant="secondary" onClick={() => void copy()}>Copy review brief</Button>
      <p className="text-xs leading-relaxed text-ink-muted">Paste this into OpenCode or another connected assistant while the project is open. SkaleAgents returns source-backed checks and review questions; your assistant reasons through the design tradeoffs with you.</p>
    </section>
  );
}
