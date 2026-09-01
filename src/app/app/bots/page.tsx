"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  apiFetch,
  ensureCsrfCookie,
  type ApiUser,
  type AuthSession,
  type Bot,
} from "@/lib/api";
import { Button, FieldLabel, LinkButton, TextInput } from "@/components/ui";

export default function BotsDirectoryPage() {
  const queryClient = useQueryClient();
  const [grokCode, setGrokCode] = useState("demo");

  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: async (): Promise<ApiUser | null> => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082";
      const res = await fetch(`${API_URL}/api/user`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(res.statusText);
      return res.json() as Promise<ApiUser>;
    },
  });

  const botsQuery = useQuery({
    queryKey: ["bots", userQuery.data?.id ?? "guest"],
    queryFn: async () => {
      const data = await apiFetch<{ bots: Bot[] }>("/api/bots");
      return data.bots;
    },
  });

  const grokSignIn = useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie();
      return apiFetch<AuthSession>("/api/auth/grok/callback", {
        method: "POST",
        body: JSON.stringify({
          code: grokCode,
          displayName: "Grok User",
        }),
      });
    },
    onSuccess: (session) => {
      queryClient.setQueryData(["user"], session.user);
      void queryClient.invalidateQueries({ queryKey: ["bots"] });
      toast.success("Signed in with Grok Bot");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const grokLink = useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie();
      return apiFetch<ApiUser>("/api/auth/grok/link", {
        method: "POST",
        body: JSON.stringify({ code: grokCode }),
      });
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["user"], user);
      toast.success("Grok Bot linked");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const signedIn = Boolean(userQuery.data);
  const grokLinked = Boolean(userQuery.data?.grokLinked);

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Bot directory
          </h1>
          <p className="mt-1 max-w-xl text-sm text-ink-muted">
            Discover specialist agents for DevOps, security, and scaling. The
            directory is one surface of the control plane — studio, prompts, and
            MCP tokens live alongside it.
          </p>
        </div>
        <LinkButton href="/app/studio">Create bot</LinkButton>
      </div>

      <section className="rounded-[10px] border border-line bg-canvas-elevated p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold text-ink">Grok Bot</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {grokLinked
                ? "This account is linked to a Grok Bot session for agent-assisted reviews."
                : signedIn
                  ? "Link Grok Bot to this Google account so directory and studio actions can use your AI session."
                  : "Sign in with Grok Bot here to try agent-linked browsing, or use Google from the main sign-in for a full account."}
            </p>
          </div>
          {grokLinked ? (
            <p className="font-mono text-xs uppercase tracking-wide text-accent">
              Linked
            </p>
          ) : (
            <div className="flex w-full max-w-sm flex-col gap-2 sm:w-auto">
              <label className="block space-y-1">
                <FieldLabel>Mock Grok code</FieldLabel>
                <TextInput
                  value={grokCode}
                  onChange={(e) => setGrokCode(e.target.value)}
                  className="font-mono"
                />
              </label>
              <Button
                type="button"
                variant={signedIn ? "secondary" : "primary"}
                disabled={
                  grokCode.trim() === "" ||
                  grokSignIn.isPending ||
                  grokLink.isPending
                }
                onClick={() =>
                  signedIn ? grokLink.mutate() : grokSignIn.mutate()
                }
              >
                {signedIn
                  ? grokLink.isPending
                    ? "Linking…"
                    : "Link Grok Bot"
                  : grokSignIn.isPending
                    ? "Signing in…"
                    : "Sign in with Grok Bot"}
              </Button>
              {!signedIn && (
                <p className="text-xs text-ink-muted">
                  Prefer a full account?{" "}
                  <Link href="/app/login" className="underline-offset-2 hover:underline">
                    Continue with Google
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {botsQuery.isPending && (
        <p className="text-sm text-ink-muted">Loading bots…</p>
      )}
      {botsQuery.isError && (
        <p className="text-sm text-danger">
          {botsQuery.error instanceof Error
            ? botsQuery.error.message
            : "Failed to load"}
        </p>
      )}
      {botsQuery.data && botsQuery.data.length === 0 && (
        <p className="text-sm text-ink-muted">No bots yet.</p>
      )}

      <ul className="divide-y divide-line">
        {botsQuery.data?.map((bot) => (
          <li key={bot.id} className="py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link
                href={`/app/studio/${bot.id}`}
                className="text-lg font-medium text-ink hover:underline"
              >
                {bot.name}
              </Link>
              <div className="flex gap-2 font-mono text-xs uppercase tracking-wide text-ink-muted">
                <span>{bot.specialty}</span>
                <span>{bot.visibility}</span>
                <span>{bot.status}</span>
              </div>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              {bot.description || "No description"}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
