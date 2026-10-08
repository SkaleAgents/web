"use client";

import { useEffect, useRef, useState } from "react";
import { Button, LinkButton } from "@/components/ui";

import { examples } from "@/components/marketing/example-data";

export function ExampleExplorer() {
  const root = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [readingPrompt, setReadingPrompt] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [projectContext, setProjectContext] = useState("");
  const [responseFormat, setResponseFormat] = useState("Prioritized findings");
  const example = examples[selected];
  const customized = Boolean(projectContext.trim()) || responseFormat !== "Prioritized findings";
  const prompt = [
    example.prompt,
    ...(projectContext.trim() ? [`Project context:\n${projectContext.trim()}`] : []),
    ...(customized ? [`Response format: ${responseFormat}.`] : []),
  ].join("\n\n");
  const playing = inView && pageVisible && !paused && !hovered && !focused && !readingPrompt;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    if (root.current) observer.observe(root.current);
    const onVisibilityChange = () => setPageVisible(!document.hidden);
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  function selectExample(index: number) {
    setSelected(index);
    setCopyState("idle");
    setReadingPrompt(false);
    setCycle((current) => current + 1);
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <div ref={root} className="example-explorer mt-9" data-playing={playing} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="grid items-start gap-6 lg:grid-cols-[190px_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-6">
      <div className="mb-4 flex items-center justify-between gap-2 lg:block">
        <p className="marketing-eyebrow example-auto-label">Auto preview / 9 seconds</p>
        <p className="marketing-eyebrow example-manual-label">Choose a review</p>
        <button type="button" className="example-rotation-toggle rounded px-2 py-1 text-xs text-ink-muted hover:bg-accent-soft hover:text-ink lg:mt-3" aria-pressed={paused} onClick={() => setPaused(!paused)}>
          <span aria-hidden="true" className="mr-2">{paused ? "▷" : "Ⅱ"}</span>{paused ? "Resume examples" : "Pause examples"}
        </button>
      </div>
      <fieldset>
        <legend className="sr-only">Choose a review example</legend>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-3">
          {examples.map((item, index) => (
            <label key={item.id} className="relative min-w-0 cursor-pointer">
              <input
                type="radio"
                name="review-example"
                value={item.id}
                aria-label={item.label}
                checked={selected === index}
                onChange={() => selectExample(index)}
                className="peer sr-only"
              />
              <span className="relative block overflow-hidden rounded-[6px] border border-line px-4 py-4 text-sm text-ink-muted transition hover:bg-accent-soft peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                <span className="block font-semibold">{item.label}</span>
                <span className="mt-1 block font-mono text-[10px] uppercase tracking-wide" aria-hidden="true">0{index + 1} / {item.specialty}</span>
                {selected === index && <span key={cycle} className="example-countdown" aria-hidden="true" onAnimationEnd={(event) => { if (event.animationName === "example-countdown" && playing) selectExample((selected + 1) % examples.length); }} />}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="example-auto-label mt-4 hidden text-xs leading-relaxed text-ink-muted lg:block">Pauses while you hover, focus, or read a prompt. Pick any topic to explore it.</p>
      </div>

      <div key={example.id} className="motion-enter min-w-0 overflow-hidden rounded-[10px] border border-line bg-canvas-elevated lg:grid lg:min-h-[48rem] lg:grid-rows-[auto_1fr_auto]" role="region" aria-label={`${example.label} example`} aria-live="off">
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
            {example.proposal && <div className="mt-6 border-l-2 border-accent pl-4">
              <p className="text-sm font-semibold">Public database</p>
              <p className="mt-2 font-mono text-xs leading-7 text-ink-muted sm:text-sm">{example.proposal}</p>
            </div>}
            <div className="mt-6 border-l-2 border-accent pl-4">
              <p className="text-sm font-semibold">Suggested next step</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{example.fix}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-line p-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-md text-sm text-ink-muted">Try this approach with your own context. These examples are not live audit results.</p>
            <Button type="button" variant="secondary" onClick={() => void copyPrompt()}>{customized ? "Copy custom prompt" : "Copy starter prompt"}</Button>
          </div>
          <p role="status" className="mt-2 text-sm text-ink-muted">
            {copyState === "copied" ? "Prompt copied. Paste it into your AI assistant." : copyState === "failed" ? "Clipboard unavailable. Select and copy the starter prompt below." : ""}
          </p>
          <details className="mt-2 text-sm" key={example.id} open={copyState === "failed" ? true : undefined} onToggle={(event) => setReadingPrompt(event.currentTarget.open)}>
            <summary className="w-fit cursor-pointer py-2 font-semibold underline decoration-line underline-offset-4">Read or customize the prompt</summary>
            <div className="mt-4 grid gap-4">
              <label className="grid gap-2 font-semibold" htmlFor="example-project-context">
                What are you working on?
                <textarea id="example-project-context" value={projectContext} maxLength={1000} rows={3} placeholder="For example: a Node.js API on Kubernetes, preparing for our first production release." className="w-full resize-y rounded-md border border-line bg-canvas px-3 py-2 text-sm font-normal text-ink" onChange={(event) => { setProjectContext(event.target.value); setCopyState("idle"); setPaused(true); }} />
              </label>
              <div className="flex flex-wrap items-end gap-4">
                <label className="grid flex-1 gap-2 font-semibold" htmlFor="example-response-format">
                  How should the answer look?
                  <select id="example-response-format" value={responseFormat} className="rounded-md border border-line bg-canvas px-3 py-2 font-normal text-ink" onChange={(event) => { setResponseFormat(event.target.value); setCopyState("idle"); setPaused(true); }}>
                    <option>Prioritized findings</option>
                    <option>Pull request checklist</option>
                    <option>Step-by-step plan</option>
                  </select>
                </label>
                <Button type="button" variant="ghost" onClick={() => { setProjectContext(""); setResponseFormat("Prioritized findings"); setCopyState("idle"); }}>Reset prompt</Button>
              </div>
              <p className="text-xs text-ink-muted">The preview updates as you type. Your text stays in this page until you copy it into an assistant.</p>
              <div>
                <p className="marketing-eyebrow mb-2">Your prompt preview</p>
                <p className="select-text whitespace-pre-wrap break-words rounded-md bg-canvas p-4 leading-relaxed text-ink-muted" data-prompt-preview>{prompt}</p>
              </div>
            </div>
          </details>
        </div>
      </div>
      </div>
      <div className="mt-5 flex justify-end"><LinkButton href="/me/jobs" variant="ghost">Bring your own infrastructure to an audit <span aria-hidden="true" className="ml-2">↗</span></LinkButton></div>
    </div>
  );
}
