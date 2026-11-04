"use client";

import { useId, useRef } from "react";
import { usePathname } from "next/navigation";
import { Button, LinkButton } from "@/components/ui";
import { GitHubSignInLabel } from "@/components/github-mark";
import { usePersonalPlanUsage } from "@/components/personal-plan-note";
import { personalDestinationFromPath } from "@/lib/dashboard-routes";

/** Premium entry point for scanning a connected GitHub repository. The connection itself is not built yet (see the GitHub connection design). */
export function GithubScanButton() {
  const pathname = usePathname();
  const usage = usePersonalPlanUsage().data;
  const paid = Boolean(usage && (!usage.enforced || usage.plan !== "free"));
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = () => dialog.current?.close();

  return (
    <>
      <Button type="button" variant="secondary" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
        <GitHubSignInLabel>Connect GitHub</GitHubSignInLabel>
        <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-ink">Premium</span>
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-canvas-elevated p-6 text-ink shadow-2xl"
        onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      >
        <h2 id={titleId} className="text-lg font-semibold">Scan a GitHub repository</h2>
        <p className="mt-2 text-sm text-ink-muted">Connect GitHub, pick a repository and branch, and review its infrastructure files, including private repositories. This is a Premium feature.</p>
        {paid && <p className="mt-3 rounded-[10px] border border-line p-3 text-sm" role="status">Your plan includes it. We are still building the connection and will turn it on here.</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={close}>{paid ? "Close" : "Not now"}</Button>
          {!paid && <LinkButton href={personalDestinationFromPath(pathname, "billing")} onClick={close}>Upgrade</LinkButton>}
        </div>
      </dialog>
    </>
  );
}
