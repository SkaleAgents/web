"use client";

import { useState } from "react";
import { Button, LinkButton } from "@/components/ui";

const examples = [
  {
    id: "security",
    label: "Security",
    specialty: "DevSecOps",
    title: "Catch the open door before you ship.",
    description: "Bring a Terraform snippet or a Kubernetes manifest. Ask for exposed services, broad permissions, and the smallest useful fix.",
    filename: "security-group.tf",
    input: 'ingress {\n  from_port   = 22\n  to_port     = 22\n  protocol    = "tcp"\n  cidr_blocks = ["0.0.0.0/0"]\n}',
    finding: "SSH is reachable from any IPv4 address.",
    evidence: "Port 22 accepts traffic from 0.0.0.0/0. Any host on the internet can attempt a connection if the instance is publicly reachable.",
    fix: "Restrict ingress to your approved access network, or use a session-based access method. Confirm the access path before removing the rule.",
    prompt: "Review my Terraform for exposed ports and overly broad IAM permissions. Cite the exact configuration behind each finding, propose the smallest fix, and include a validation step. Ask for missing context before making assumptions.",
  },
  {
    id: "reliability",
    label: "Reliability",
    specialty: "SRE",
    title: "Find the weak point in your recovery plan.",
    description: "Review deployment configuration and failure symptoms together. Look for single points of failure and checks that miss an unhealthy service.",
    filename: "deployment.yaml",
    input: 'spec:\n  replicas: 1\n  template:\n    spec:\n      containers:\n        - name: api\n          image: api:1.4\n          ports:\n            - containerPort: 8080',
    finding: "One replica, with no readiness probe shown.",
    evidence: "The supplied configuration has a single API replica. It does not define a readiness check to tell Kubernetes when the app can serve traffic.",
    fix: "Define a readiness endpoint and test it during startup and dependency failures. Evaluate additional replicas against your availability needs and budget.",
    prompt: "Review my Kubernetes deployment for availability risks. Check replica count, health probes, rollout behavior, and recovery paths. Separate confirmed findings from missing context, then propose changes and a failure test for each.",
  },
  {
    id: "ai-workloads",
    label: "AI workloads",
    specialty: "MLOps",
    title: "Give every model call a budget.",
    description: "Bring model-routing settings and workload context. Review where retries, token use, or slow requests could make an AI feature expensive to operate.",
    filename: "model-client.json",
    input: '{\n  "requestTimeoutMs": 120000,\n  "maxRetries": 8,\n  "cacheEnabled": false\n}',
    finding: "Long timeouts and repeated retries can compound latency.",
    evidence: "Each attempt may wait up to two minutes, with eight retries configured. Actual request time depends on the client and its retry policy.",
    fix: "Set an end-to-end deadline and retry only transient failures. Measure token usage and tail latency before changing model routes or adding a cache.",
    prompt: "Review my AI application's model client and routing configuration. Check retry limits, request deadlines, token budgets, and cache suitability. Explain latency and cost tradeoffs, and list the measurements needed to validate each recommendation.",
  },
  {
    id: "scaling",
    label: "Scaling & cost",
    specialty: "Performance",
    title: "Make scaling decisions with context.",
    description: "Inspect resource requests and scaling policies before adding more capacity. Turn a vague performance concern into something you can measure.",
    filename: "autoscaler.yaml",
    input: 'spec:\n  minReplicas: 1\n  maxReplicas: 1\n  metrics:\n    - type: Resource\n      resource:\n        name: cpu\n        target:\n          averageUtilization: 70',
    finding: "The autoscaler cannot add a second replica.",
    evidence: "Both minReplicas and maxReplicas are set to 1. The CPU target cannot trigger additional capacity above that limit.",
    fix: "Choose a maximum based on load tests, cluster capacity, and spend limits. Check resource requests and downstream bottlenecks before raising it.",
    prompt: "Review my autoscaling policy and resource configuration. Identify limits that prevent scaling, explain likely bottlenecks, and suggest a load test. Include cost tradeoffs and avoid recommending more capacity without supporting measurements.",
  },
];

export function ExampleExplorer() {
  const [selected, setSelected] = useState(0);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const example = examples[selected];

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(example.prompt);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <div className="mt-9">
      <fieldset>
        <legend className="sr-only">Choose a review example</legend>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {examples.map((item, index) => (
            <label key={item.id} className="relative cursor-pointer">
              <input
                type="radio"
                name="review-example"
                value={item.id}
                checked={selected === index}
                onChange={() => { setSelected(index); setCopyState("idle"); }}
                className="peer sr-only"
              />
              <span className="block rounded-[6px] border border-line px-4 py-3 text-center text-sm font-semibold text-ink-muted transition hover:bg-accent-soft peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div key={example.id} className="motion-enter mt-6 overflow-hidden rounded-[10px] border border-line bg-canvas-elevated" role="region" aria-label={`${example.label} example`}>
        <div className="border-b border-line p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="marketing-eyebrow">{example.specialty} / review brief</p>
            <span className="rounded border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-muted">Illustrative example</span>
          </div>
          <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{example.title}</h3>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">{example.description}</p>
        </div>
        <div className="grid lg:grid-cols-2">
          <div className="min-w-0 border-b border-line bg-canvas p-6 sm:p-8 lg:border-r lg:border-b-0">
            <p className="marketing-eyebrow">01 / What you bring</p>
            <p className="mt-5 font-mono text-xs text-ink-muted">{example.filename}</p>
            <pre className="mt-4 overflow-x-auto font-mono text-xs leading-7 sm:text-sm"><code>{example.input}</code></pre>
          </div>
          <div className="p-6 sm:p-8">
            <p className="marketing-eyebrow">02 / What a review looks like</p>
            <h4 className="mt-5 text-lg font-semibold">{example.finding}</h4>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">{example.evidence}</p>
            <div className="mt-6 border-l-2 border-accent pl-4">
              <p className="text-sm font-semibold">Suggested next step</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{example.fix}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-line p-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-md text-sm text-ink-muted">Try this approach with your own context. These examples are not live audit results.</p>
            <Button type="button" variant="secondary" onClick={() => void copyPrompt()}>Copy starter prompt</Button>
          </div>
          <p role="status" className="mt-2 text-sm text-ink-muted">
            {copyState === "copied" ? "Prompt copied. Paste it into your AI assistant." : copyState === "failed" ? "Clipboard unavailable. Select and copy the starter prompt below." : ""}
          </p>
          <details className="mt-2 text-sm" key={example.id} open={copyState === "failed" ? true : undefined}>
            <summary className="w-fit cursor-pointer py-2 font-semibold underline decoration-line underline-offset-4">Read the starter prompt</summary>
            <p className="mt-2 select-text rounded-md bg-canvas p-4 leading-relaxed text-ink-muted">{example.prompt}</p>
          </details>
        </div>
      </div>
      <div className="mt-5 flex justify-end"><LinkButton href="/jobs" variant="ghost">Bring your own infrastructure to an audit <span aria-hidden="true" className="ml-2">↗</span></LinkButton></div>
    </div>
  );
}
