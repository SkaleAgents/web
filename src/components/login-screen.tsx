"use client";

import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";
import { EmailSignIn } from "@/components/email-sign-in";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { currentUserOptions } from "@/lib/session";
import { API_URL } from "@/lib/api";
import { dashboardDestination } from "@/lib/dashboard";
import { hasWorkspaceInvitation, WORKSPACE_INVITATION_PATH } from "@/lib/workspace-invitations";
import { Button } from "@/components/ui";

export function LoginScreen({ reauthenticate = false }: { reauthenticate?: boolean }) {
  const user = useQuery(currentUserOptions);
  const router = useRouter();
  useEffect(() => {
    if (!user.data || user.isError || reauthenticate) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth") === "1") {
      window.location.replace(`${API_URL}/oauth/authorize`);
    } else {
      router.replace(hasWorkspaceInvitation() ? WORKSPACE_INVITATION_PATH : dashboardDestination(params.get("next")));
    }
  }, [router, user.data, user.isError, reauthenticate]);
  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (!error) return;

    toast.error(
      error === "invalid_state"
        ? "Your Google sign-in expired. Please try again."
        : "Google sign-in failed. Please try again.",
    );
    window.history.replaceState({}, "", "/login");
  }, []);

  if (user.isError) return <main className="mx-auto space-y-4 px-6 py-16" role="alert"><h1 className="text-xl font-semibold">Could not check your session</h1><Button onClick={() => void user.refetch()}>Try again</Button></main>;
  if (user.isPending || (user.data && !reauthenticate)) return <main className="px-6 py-16 text-center text-sm text-ink-muted" role="status">{user.data ? "Opening your workspace…" : "Checking your session…"}</main>;

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(900px 480px at 8% 0%, var(--accent-soft), transparent 55%),
            radial-gradient(640px 360px at 100% 80%, color-mix(in srgb, var(--accent-soft) 55%, transparent), transparent 50%),
            repeating-linear-gradient(
              -18deg,
              transparent,
              transparent 14px,
              color-mix(in srgb, var(--line) 40%, transparent) 14px,
              color-mix(in srgb, var(--line) 40%, transparent) 15px
            )
          `,
        }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-5xl flex-1 items-center gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-20">
        <div className="motion-enter max-w-lg">
          <h1 className="font-display text-[clamp(2.5rem,6vw,3.75rem)] font-bold leading-[0.95] tracking-tight text-ink">
            Sign in to your
            <br />
            control plane
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-muted">
            Save your specialist bots and prompts, manage audit jobs, and
            connect your editor through MCP.
          </p>
          <p className="mt-8 hidden text-sm text-ink-muted lg:block">
            Prefer to look around first?{" "}
            <Link
              href="/bots"
              className="font-medium text-ink underline-offset-4 hover:underline"
            >
              Browse the directory
            </Link>
          </p>
        </div>

        <div
          className="motion-enter relative space-y-5 rounded-[10px] border border-line bg-canvas-elevated p-7 sm:p-8"
          style={{ animationDelay: "60ms" }}
        >
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 w-[3px] rounded-l-[10px] bg-accent"
          />

          <EmailSignIn />

          <details className="border-t border-line pt-5 text-sm text-ink-muted">
            <summary className="cursor-pointer">Connecting an MCP client?</summary>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              After sign-in, approve the MCP access request and return to
              your MCP client. The client handles credentials automatically.
            </p>
          </details>

          <p className="text-center text-sm text-ink-muted lg:hidden">
            <Link href="/bots" className="underline-offset-4 hover:underline">
              Browse the directory
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
