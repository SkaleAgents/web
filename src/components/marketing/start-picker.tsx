"use client";

import { useRef, useState } from "react";
import { Button, LinkButton } from "@/components/ui";

import { goals } from "@/components/marketing/start-picker-data";

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
