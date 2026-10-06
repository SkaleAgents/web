"use client";

import { useId, useRef, type ComponentProps } from "react";
import { Button, LinkButton } from "@/components/ui";

export function GetStartedButton({ variant = "primary", className }: Pick<ComponentProps<typeof Button>, "variant" | "className">) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const close = () => dialog.current?.close();

  return (
    <>
      <Button type="button" variant={variant} className={className} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
        <span className="inline-flex items-center gap-2">Get started<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16m-6-6 6 6-6 6" /></svg></span>
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="get-started-dialog m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border border-line bg-canvas-elevated p-6 text-ink shadow-2xl sm:p-8"
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="marketing-eyebrow">Start at your own pace</p>
          <Button type="button" variant="ghost" onClick={close} aria-label="Close getting started panel" className="size-9 p-0 text-xl">×</Button>
        </div>
        <h2 id={titleId} className="mt-4 font-display text-3xl font-semibold tracking-tight">Choose how to get started.</h2>
        <p id={descriptionId} className="mt-3 text-base leading-relaxed text-ink-muted">Explore a sample or browse public bots first. Sign in when you want to save your own work and connect your tools.</p>

        <div className="mt-6 rounded-lg border border-line bg-canvas p-5">
          <h3 className="text-base font-semibold">Explore without an account</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">Change the demo settings and watch the sample findings update, or find a specialist prompt for your assistant.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <LinkButton href="/#sample-demo" variant="secondary" onClick={close}>Try the editable demo</LinkButton>
            <LinkButton href="/bots" variant="ghost" onClick={close}>Browse public bots</LinkButton>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-6">
          <h3 className="text-base font-semibold">Bring SkaleAgents into your editor</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">Connect the AI you already use. It checks your application and your infrastructure, then tells you what to change.</p>
          <LinkButton href="/mcp-config" className="mt-4 w-full py-3" onClick={close}>Set up MCP</LinkButton>
        </div>
      </dialog>
    </>
  );
}
