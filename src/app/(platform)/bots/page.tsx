"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, type ApiUser, type Bot, googleSignInHref } from "@/lib/api";
import { LinkButton } from "@/components/ui";

export default function BotsDirectoryPage() {
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
            directory is one surface of the control plane. Studio, prompts, and
            MCP tokens live alongside it.
          </p>
        </div>
        {signedIn ? (
          <LinkButton href="/studio">Create bot</LinkButton>
        ) : (
          <LinkButton href={googleSignInHref()}>Sign in to create</LinkButton>
        )}
      </div>

      <section className="rounded-[10px] border border-line bg-canvas-elevated p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold text-ink">Grok Bot</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {grokLinked
                ? "This account is linked to a Grok Bot session for agent-assisted reviews."
                : "Grok Bot linking is on hold until an official provider integration is available. Google sign-in and the rest of the control plane are ready to use."}
            </p>
          </div>
          {grokLinked ? (
            <p className="font-mono text-xs uppercase tracking-wide text-accent">
              Linked
            </p>
          ) : (
            <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">
              Deferred
            </p>
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
              {userQuery.data?.id === bot.ownerUserId ? (
                <Link
                  href={`/studio/${bot.id}`}
                  className="text-lg font-medium text-ink hover:underline"
                >
                  {bot.name}
                </Link>
              ) : (
                <span className="text-lg font-medium text-ink">{bot.name}</span>
              )}
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
