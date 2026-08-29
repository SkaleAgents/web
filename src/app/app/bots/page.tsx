"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, type Bot } from "@/lib/api";

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
          <h1 className="text-3xl font-semibold tracking-tight">
            Bot directory
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Public published bots, plus your own drafts when signed in.
          </p>
        </div>
        <Link
          href="/app/studio"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Create bot
        </Link>
      </div>

      {botsQuery.isPending && (
        <p className="text-sm text-zinc-500">Loading bots…</p>
      )}
      {botsQuery.isError && (
        <p className="text-sm text-red-600">
          {botsQuery.error instanceof Error
            ? botsQuery.error.message
            : "Failed to load"}
        </p>
      )}
      {botsQuery.data && botsQuery.data.length === 0 && (
        <p className="text-sm text-zinc-500">No bots yet.</p>
      )}

      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {botsQuery.data?.map((bot) => (
          <li key={bot.id} className="py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link
                href={`/app/studio/${bot.id}`}
                className="text-lg font-medium hover:underline"
              >
                {bot.name}
              </Link>
              <div className="flex gap-2 text-xs uppercase tracking-wide text-zinc-500">
                <span>{bot.specialty}</span>
                <span>{bot.visibility}</span>
                <span>{bot.status}</span>
              </div>
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {bot.description || "No description"}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
