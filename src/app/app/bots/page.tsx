"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, type Bot } from "@/lib/api";
import { LinkButton } from "@/components/ui";

export default function BotsDirectoryPage() {
  const botsQuery = useQuery({
    queryKey: ["bots"],
    queryFn: async () => {
      const data = await apiFetch<{ bots: Bot[] }>("/api/bots");
      return data.bots;
    },
  });

  return (
    <main className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Bot directory
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Public published bots, plus your own drafts when signed in.
          </p>
        </div>
        <LinkButton href="/app/studio">Create bot</LinkButton>
      </div>

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
