"use client";

import { useState } from "react";
import { LinkButton } from "@/components/ui";

const workflows = [
  {
    id: "assistant",
    label: "In an AI assistant",
    heading: "Start with a specialist, not a blank chat.",
    description: "A bot packages a specialist's instructions into a reusable prompt. You bring the project context and run it in your preferred assistant.",
    steps: [
      ["Find a bot", "Browse the public directory by specialty and open a bot to read its instructions."],
      ["Choose your assistant", "Use the Grok, SuperGrok, or Claude handoff. For Codex or another assistant, copy the prompt into your session."],
      ["Add your context", "Provide relevant code or configuration. Ask for evidence and validation steps before applying a recommendation."],
    ],
    note: "No MCP setup needed. Your AI provider's account and usage limits apply.",
    href: "/bots",
    cta: "Find a specialist bot",
    codeTitle: "A useful first request",
    code: "Review this configuration.\n\nFor each finding:\n  Cite the relevant code.\n  Explain the operational impact.\n  Suggest a focused fix.\n  Show how to verify it.\n\nAsk me for any missing context.",
  },
  {
    id: "editor",
    label: "In your editor",
    heading: "Keep the review beside your code.",
    description: "MCP (Model Context Protocol) lets a compatible AI client call SkaleAgents tools. Connect from Cursor, Claude Code, or another client with local stdio support.",
    steps: [
      ["Add your client configuration", "Copy the setup from the MCP page. Your client starts @skaleagents/swarm locally with npx; Node.js 20 or newer is required."],
      ["Ask for a review", "Have your assistant call review_architecture with relevant source or IaC and a security, reliability, cost, or general focus. The first call opens browser authorization."],
      ["Authorize through Google", "Sign in if needed and approve MCP access. Return to your editor to continue the review. Credentials are saved and refreshed automatically."],
    ],
    note: "Your client sends the content you include in tool calls. Manage connected clients from the MCP page.",
    href: "/settings",
    cta: "See MCP setup",
    codeTitle: "Ask your connected client",
    code: "Review this app with SkaleAgents.\n\nCall review_architecture with:\n  Relevant source and infrastructure\n  A security and reliability focus\n\nExplain the findings and suggest\nvalidation steps for each fix.",
  },
  {
    id: "team",
    label: "In the web app",
    heading: "Take a finding into a shared review.",
    description: "Submit infrastructure text as an audit job, then inspect the findings in a Watchtower session with your team.",
    steps: [
      ["Scope an audit", "Sign in, paste your IaC, and select DevSecOps, SRE, MLOps, or scaling specialists. Add telemetry JSON when it helps."],
      ["Review the results", "Open Watchtower from the job to inspect findings, share the session, and send a redirect instruction."],
      ["Repeat when needed", "Create a scheduled audit with a cron expression and timezone. An optional webhook receives completion or failure alerts."],
    ],
    note: "Schedules review the supplied IaC text. They don't automatically track changes in your repository.",
    href: "/jobs",
    cta: "Open audit jobs",
    codeTitle: "Your review checklist",
    code: "Scope       Infrastructure text\nSpecialists Selected for the task\nContext     Optional telemetry\n\nInspect findings in Watchtower.\nDiscuss the proposed remediation.\nValidate changes in your own workflow.",
  },
];

export function WorkflowExplorer() {
  const [selected, setSelected] = useState(0);
  const workflow = workflows[selected];

  return (
    <div className="mt-9">
      <fieldset>
        <legend className="sr-only">Choose where to work</legend>
        <div className="flex flex-wrap gap-2 border-b border-line pb-4">
          {workflows.map((item, index) => (
            <label key={item.id} className="cursor-pointer">
              <input type="radio" name="workflow" value={item.id} checked={selected === index} onChange={() => setSelected(index)} className="peer sr-only" />
              <span className="block rounded-md px-4 py-3 text-sm font-semibold text-ink-muted hover:bg-accent-soft peer-checked:bg-ink peer-checked:text-canvas peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">{item.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div key={workflow.id} className="motion-enter mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr]" role="region" aria-label={workflow.label}>
        <div>
          <h3 className="font-display text-2xl font-semibold tracking-tight">{workflow.heading}</h3>
          <p className="mt-3 leading-relaxed text-ink-muted">{workflow.description}</p>
          <ol className="mt-7 space-y-6">
            {workflow.steps.map(([title, description], index) => (
              <li key={title} className="flex gap-4">
                <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-md border border-line font-mono text-xs text-ink-muted">0{index + 1}</span>
                <div><h4 className="font-semibold">{title}</h4><p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p></div>
              </li>
            ))}
          </ol>
          <LinkButton href={workflow.href} className="mt-8 px-5 py-3">{workflow.cta}<span aria-hidden="true" className="ml-3">↗</span></LinkButton>
        </div>
        <aside className="min-w-0 self-start rounded-[10px] border border-line bg-canvas-elevated p-6 sm:p-8">
          <div aria-hidden="true" className="mb-8 flex gap-1.5"><span className="size-2 rounded-full bg-accent" /><span className="size-2 rounded-full bg-line" /><span className="size-2 rounded-full bg-line" /></div>
          <p className="marketing-eyebrow">{workflow.codeTitle}</p>
          <pre className="mt-5 whitespace-pre-wrap break-words font-mono text-xs leading-7 sm:text-sm"><code>{workflow.code}</code></pre>
          <p className="mt-7 border-t border-line pt-5 text-sm leading-relaxed text-ink-muted">{workflow.note}</p>
        </aside>
      </div>
    </div>
  );
}
