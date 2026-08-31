"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  apiFetch,
  ensureCsrfCookie,
  type AuthSession,
} from "@/lib/api";
import { Button } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const googleLogin = useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie();
      return apiFetch<AuthSession>("/api/auth/google/callback", {
        method: "POST",
        body: JSON.stringify({
          code: "demo-google",
          displayName: "Rayhan",
          email: "rayhan@example.com",
        }),
      });
    },
    onSuccess: (session) => {
      queryClient.setQueryData(["user"], session.user);
      toast.success(`Signed in as ${session.user.displayName}`);
      router.push("/app");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

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
            Manage specialist agents, prompt libraries, and MCP access from one
            place — not just a bot list.
          </p>
          <p className="mt-8 hidden text-sm text-ink-muted lg:block">
            Prefer to look around first?{" "}
            <Link
              href="/app/bots"
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

          <div>
            <h2 className="text-lg font-semibold text-ink">Continue</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Use Google for your SkaleAgents account. Connect Grok Bot later
              from the directory when you want IDE-linked sessions.
            </p>
          </div>

          <Button
            type="button"
            disabled={googleLogin.isPending}
            className="w-full py-2.5 text-[15px]"
            onClick={() => googleLogin.mutate()}
          >
            {googleLogin.isPending
              ? "Signing in…"
              : "Continue with Google"}
          </Button>

          <p className="text-xs text-ink-muted">
            Phase 1 uses a mock Google callback. Production will use real Google
            OAuth.
          </p>

          <p className="text-center text-sm text-ink-muted lg:hidden">
            <Link href="/app/bots" className="underline-offset-4 hover:underline">
              Browse the directory
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
