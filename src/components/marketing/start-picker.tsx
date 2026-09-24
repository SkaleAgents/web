"use client";

import { useRef, useState } from "react";
import { Button, LinkButton } from "@/components/ui";

const goals = [
  {
    id: "explore",
    label: "Try a specialist",
    description: "Start with instructions you can use today.",
    question: "What would help you get going?",
    options: [
      { label: "Find a specialist bot", title: "Start in the bot directory.", description: "Read a specialist's instructions, then open them in your preferred assistant or copy the prompt.", note: "Browse public bots without signing in.", href: "/bots", cta: "Explore the directory" },
      { label: "Grab a ready-made prompt", title: "Start with a community prompt.", description: "Pick a prompt for the task in front of you and adapt it to your project's context.", note: "Read community prompts without signing in.", href: "/prompts", cta: "Open the prompt library" },
    ],
  },
  {
    id: "review",
    label: "Review infrastructure",
    description: "Bring your own code or configuration.",
    question: "Where do you want the review to happen?",
    options: [
      { label: "Inside my editor", title: "Connect your editor with MCP.", description: "Add the client configuration and ask your assistant to call review_architecture with the relevant source. The first call opens your browser to sign in and approve MCP access.", note: "OAuth handles your connection credentials automatically.", href: "/mcp-config", cta: "See MCP setup" },
      { label: "In a shared web review", title: "Start an audit, then open Watchtower.", description: "Paste infrastructure text, select specialists, and inspect the findings in a shared review session.", note: "Google sign-in is needed to create and manage audit jobs.", href: "/jobs", cta: "Open audit jobs" },
      { label: "On a recurring schedule", title: "Give the review a schedule.", description: "Choose the supplied infrastructure scope, a cron expression, and a timezone. Add a webhook if you want completion or failure alerts.", note: "Google sign-in is needed. Schedules rerun the text you supply, not a live repository.", href: "/schedules", cta: "Explore scheduled audits" },
    ],
  },
  {
    id: "create",
    label: "Build my own bot",
    description: "Turn your review process into reusable instructions.",
    question: "Who should be able to find it?",
    options: [
      { label: "Keep it private", title: "Make a private bot in Studio.", description: "Write your instructions, choose a specialty, and select Private in Creator Studio. Refine the bot as a draft before publishing.", note: "Google sign-in is needed. Private bots are available to their owner.", href: "/studio", cta: "Open Creator Studio" },
      { label: "Share it publicly", title: "Publish a bot for the community.", description: "Write your specialist's instructions and select Public in Creator Studio. Publish when you're ready for it to appear in the directory.", note: "Google sign-in is needed to create and publish a bot.", href: "/studio", cta: "Open Creator Studio" },
    ],
  },
];

export function StartPicker() {
  const [goalIndex, setGoalIndex] = useState<number | null>(null);
  const [optionIndex, setOptionIndex] = useState<number | null>(null);
  const firstChoice = useRef<HTMLInputElement>(null);
  const goal = goalIndex === null ? null : goals[goalIndex];
  const recommendation = goal && optionIndex !== null ? goal.options[optionIndex] : null;

  return (
    <div className="rounded-[10px] border border-line bg-accent-soft p-6 sm:p-10">
      <p className="marketing-eyebrow">Your next step</p>
      <h2 id="next-step-heading" className="marketing-heading">Find your starting point.</h2>
      <p className="mt-4 max-w-xl leading-relaxed text-ink-muted">Two choices. A suggested workflow. Explore the options here before opening the app.</p>

      <fieldset className="mt-8">
        <legend className="mb-4 text-sm font-semibold">1. What would you like to do?</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {goals.map((item, index) => (
            <label key={item.id} className="cursor-pointer">
              <input ref={index === 0 ? firstChoice : undefined} type="radio" name="starting-goal" aria-label={item.label} checked={goalIndex === index} onChange={() => { setGoalIndex(index); setOptionIndex(null); }} className="peer sr-only" />
              <span className="block h-full rounded-lg border border-line bg-canvas-elevated p-4 transition hover:border-accent peer-checked:border-accent peer-checked:bg-canvas peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                <span className="block font-semibold">{item.label}</span>
                <span className="mt-2 block text-sm leading-relaxed text-ink-muted">{item.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {goal && (
        <fieldset key={goal.id} className="motion-enter mt-7">
          <legend className="mb-4 text-sm font-semibold">2. {goal.question}</legend>
          <div className="flex flex-wrap gap-3">
            {goal.options.map((option, index) => (
              <label key={option.label} className="cursor-pointer">
                <input type="radio" name="starting-preference" checked={optionIndex === index} onChange={() => setOptionIndex(index)} className="peer sr-only" />
                <span className="block rounded-md border border-line bg-canvas-elevated px-4 py-3 text-sm font-semibold transition hover:border-accent peer-checked:border-ink peer-checked:bg-ink peer-checked:text-canvas peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div aria-live="polite" aria-atomic="true">
        {recommendation && (
          <div key={`${goalIndex}-${optionIndex}`} className="motion-enter mt-7 border-t border-line pt-7">
            <p className="marketing-eyebrow">Suggested for you</p>
            <h3 className="mt-3 font-display text-2xl font-semibold">{recommendation.title}</h3>
            <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">{recommendation.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <LinkButton href={recommendation.href} className="px-5 py-3">{recommendation.cta}<span aria-hidden="true" className="ml-3">↗</span></LinkButton>
              <p className="max-w-md text-sm text-ink-muted">{recommendation.note}</p>
            </div>
          </div>
        )}
      </div>

      {goal && <Button type="button" variant="ghost" className="mt-5" onClick={() => { setGoalIndex(null); setOptionIndex(null); firstChoice.current?.focus(); }}>Start over</Button>}
    </div>
  );
}
