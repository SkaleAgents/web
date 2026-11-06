"use client";

import Link from "next/link";
import { useId, useRef } from "react";
import { usePathname } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, LinkButton } from "@/components/ui";
import { GitHubSignInLabel } from "@/components/github-mark";
import { usePersonalPlanUsage } from "@/components/personal-plan-note";
import { apiFetch } from "@/lib/api";
import { personalDestinationFromPath } from "@/lib/dashboard-routes";
import { githubErrorMessage, goTo, needsUpgrade, type GithubInstallation } from "@/lib/github";
import { currentUserOptions } from "@/lib/session";

export function useGithubInstallation(enabled: boolean) {
  const user = useQuery(currentUserOptions);
  return useQuery({
    queryKey: ["github-installation", user.data?.id ?? "guest"],
    enabled: enabled && Boolean(user.data),
    queryFn: ({ signal }) => apiFetch<GithubInstallation>("/api/github/installation", { signal }),
  });
}

/** Premium entry point for scanning a GitHub repository: upgrade dialog on Free, install flow when not connected, the repository picker when connected. */
export function GithubScanButton({ onOpen }: { onOpen: () => void }) {
  const pathname = usePathname();
  const billing = personalDestinationFromPath(pathname, "billing");
  const usageQuery = usePersonalPlanUsage();
  const usage = usageQuery.data;
  const paid = Boolean(usage && (!usage.enforced || usage.plan !== "free"));
  const installation = useGithubInstallation(paid);
  const connected = Boolean(installation.data?.connected);
  // Until the plan and the connection are known, "Connect GitHub" would be wrong (and a Pro click would open the upgrade prompt).
  const checking = usageQuery.isPending || (paid && installation.isPending);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = () => dialog.current?.close();
  const start = useMutation({
    mutationFn: async () => goTo((await apiFetch<{ url: string }>("/api/github/install-url")).url),
  });
  const error = start.error ?? installation.error;

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        aria-haspopup={paid ? undefined : "dialog"}
        disabled={checking || (paid && start.isPending)}
        onClick={() => { if (!paid) dialog.current?.showModal(); else if (connected) onOpen(); else if (installation.data) start.mutate(); }}
      >
        <GitHubSignInLabel>{checking ? "Checking GitHub…" : connected ? "Scan a repository" : "Connect GitHub"}</GitHubSignInLabel>
        <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-ink">Premium</span>
      </Button>
      {error && <p role="alert" className="basis-full text-sm text-danger">{githubErrorMessage(error)} {needsUpgrade(error) && <Link href={billing} className="underline">Upgrade</Link>}</p>}
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-canvas-elevated p-6 text-ink shadow-2xl"
        onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      >
        <h2 id={titleId} className="text-lg font-semibold">Scan a GitHub repository</h2>
        <p className="mt-2 text-sm text-ink-muted">Connect GitHub, pick a repository and branch, and review its infrastructure files, including private repositories. This is a Premium feature.</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={close}>Not now</Button>
          <LinkButton href={billing} onClick={close}>Upgrade</LinkButton>
        </div>
      </dialog>
    </>
  );
}
