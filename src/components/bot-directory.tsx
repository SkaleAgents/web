"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, type Bot } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { Button, LinkButton, TextInput } from "@/components/ui";
import { personalDestinationFromPath } from "@/lib/dashboard-routes";

export function BotDirectory({ manage = false, initialBots }: { manage?: boolean; initialBots?: Bot[] }) {
  const pathname = usePathname();
  const personalHref = (section: string) => personalDestinationFromPath(pathname, section);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const userQuery = useQuery(currentUserOptions);

  const botsQuery = useQuery({
    queryKey: ["bots", manage ? userQuery.data?.id ?? "guest" : "public"],
    enabled: !manage || Boolean(userQuery.data),
    initialData: manage ? undefined : initialBots,
    queryFn: async ({ signal }) => {
      const data = await apiFetch<{ bots: Bot[] }>("/api/bots", { signal, credentials: manage ? "include" : "omit" });
      return data.bots;
    },
  });

  const bots = botsQuery.data?.filter(bot => manage ? bot.ownerUserId === userQuery.data?.id : bot.visibility === "public" && bot.status === "published");
  const basePath = manage ? personalHref("bots") : "/bots";
  const specialties = [...new Set(bots?.map((bot) => bot.specialty) ?? [])].sort();
  const filteredBots = bots?.filter((bot) =>
    (specialty === "all" || bot.specialty === specialty) &&
    `${bot.name} ${bot.description} ${bot.specialty}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <main className="space-y-8">
      <div className="workspace-intro flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="workspace-kicker">Explore / Specialist instructions</p>
          <h1 className="workspace-heading">
            {manage ? "My bots" : "Bot directory"}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-ink-muted">
            Find the right reviewer for the job. Open a bot to read its instructions,
            then take it to Grok, Claude, Codex, or your preferred assistant.
          </p>
        </div>
        <LinkButton href={manage ? personalHref("studio") : "/dashboard/bots"}>{manage ? "Create bot" : "Manage your bots"}</LinkButton>
      </div>

      <section aria-label="Find a bot" className="space-y-4">
        <label className="block max-w-xl space-y-2 text-sm font-semibold">
          <span>What are you working on?</span>
          <TextInput type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search bots, tasks, or specialties" />
        </label>
        <div className="flex flex-wrap gap-2" aria-label="Filter by specialty">
          {["all", ...specialties].map((item) => <button key={item} type="button" className="filter-chip" aria-pressed={specialty === item} onClick={() => setSpecialty(item)}>{item === "all" ? "All specialties" : item.toUpperCase()}</button>)}
        </div>
        {bots && <p role="status" className="text-sm text-ink-muted">{filteredBots?.length} of {bots.length} bots · Read the prompt before you run it.</p>}
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
      {bots && bots.length === 0 && (
        <p className="text-sm text-ink-muted">No bots published yet. Create a draft in Studio to start your own collection.</p>
      )}
      {Boolean(bots?.length) && filteredBots?.length === 0 && <div className="rounded-xl border border-line p-6"><h2 className="font-semibold">No bots match that search</h2><p className="my-2 text-sm text-ink-muted">Try a broader task or another specialty.</p><Button variant="secondary" onClick={() => { setSearch(""); setSpecialty("all"); }}>Clear filters</Button></div>}

      <ul className="grid gap-4 sm:grid-cols-2">
        {filteredBots?.map((bot) => (
          <li key={bot.id} className="flex flex-col rounded-xl border border-line bg-canvas-elevated p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link
                href={`${basePath}/${bot.id}`}
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
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
              <LinkButton href={`${basePath}/${bot.id}`} variant="secondary">
                View prompt
              </LinkButton>
              {manage && userQuery.data?.id === bot.ownerUserId && (
                <Link
                  href={personalHref(`studio/${bot.id}`)}
                  className="text-sm font-semibold text-ink-muted hover:text-ink"
                >
                  Edit in Studio
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
