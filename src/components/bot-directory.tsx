"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, BOT_INTEGRATIONS, SPECIALTIES, type Bot, type BotIntegration, type Specialty } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { Button, LinkButton, TextInput } from "@/components/ui";
import { personalDestinationFromPath } from "@/lib/dashboard-routes";

const SPECIALTY_LABEL: Record<Specialty, string> = {
  devops: "DevOps",
  devsecops: "DevSecOps",
  sre: "SRE",
  mlops: "MLOps",
  scaling: "Scaling",
  general: "General",
};

export function BotDirectory({ manage = false, initialBots, integration }: { manage?: boolean; initialBots?: Bot[]; integration?: BotIntegration }) {
  const pathname = usePathname();
  const personalHref = (section: string) => personalDestinationFromPath(pathname, section);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [selectedTool, setSelectedTool] = useState<BotIntegration | "all">("all");
  const activeTool = integration ?? (selectedTool === "all" ? undefined : selectedTool);
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
    (!activeTool || (bot.integrations ?? []).includes(activeTool)) &&
    `${bot.name} ${bot.description} ${bot.specialty} ${(bot.integrations ?? []).join(" ")}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const toolLabel = BOT_INTEGRATIONS.find((item) => item.slug === integration)?.label;
  const listedBots = [...(filteredBots ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  if (!manage) {
    return (
      <CatalogIndex
        bots={bots}
        listedBots={listedBots}
        pending={botsQuery.isPending}
        error={botsQuery.isError ? (botsQuery.error instanceof Error ? botsQuery.error.message : "Failed to load") : null}
        search={search}
        setSearch={setSearch}
        specialty={specialty}
        setSpecialty={setSpecialty}
        integration={integration}
        toolLabel={toolLabel}
        onClear={() => { setSearch(""); setSpecialty("all"); setSelectedTool("all"); }}
      />
    );
  }

  return (
    <main className="space-y-8">
      <div className="workspace-intro flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="workspace-kicker">Explore / Specialist instructions</p>
          <h1 className="workspace-heading">
            {manage ? "My bots" : toolLabel ? `${toolLabel} bots` : "Bot directory"}
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
        <div className="flex flex-wrap gap-2" aria-label="Filter by tool">
          {manage ? (
            <>
              <button type="button" className="filter-chip" aria-pressed={!activeTool} onClick={() => setSelectedTool("all")}>All tools</button>
              {BOT_INTEGRATIONS.map((item) => (
                <button key={item.slug} type="button" className="filter-chip" aria-pressed={activeTool === item.slug} onClick={() => setSelectedTool(item.slug)}>
                  {item.label}
                </button>
              ))}
            </>
          ) : (
            <>
              <Link href="/bots" className="filter-chip" aria-current={integration ? undefined : "page"}>All tools</Link>
              {BOT_INTEGRATIONS.map((item) => (
                <Link key={item.slug} href={`/bots/integrations/${item.slug}`} className="filter-chip" aria-current={integration === item.slug ? "page" : undefined}>
                  {item.label}
                </Link>
              ))}
              <Link href="/bots/integrations" className="filter-chip">Browse by tool</Link>
            </>
          )}
        </div>
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
      {Boolean(bots?.length) && filteredBots?.length === 0 && <div className="rounded-xl border border-line p-6"><h2 className="font-semibold">No bots match that search</h2><p className="my-2 text-sm text-ink-muted">Try a broader task, another specialty, or another tool.</p><Button variant="secondary" onClick={() => { setSearch(""); setSpecialty("all"); setSelectedTool("all"); }}>Clear filters</Button></div>}

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
            <IntegrationLinks slugs={bot.integrations} />
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

function CatalogIndex({
  bots,
  listedBots,
  pending,
  error,
  search,
  setSearch,
  specialty,
  setSpecialty,
  integration,
  toolLabel,
  onClear,
}: {
  bots?: Bot[];
  listedBots: Bot[];
  pending: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  specialty: string;
  setSpecialty: (value: string) => void;
  integration?: BotIntegration;
  toolLabel?: string;
  onClear: () => void;
}) {
  return (
    <main className="directory-index space-y-6">
      <div className="workspace-intro">
        <h1 className="workspace-heading">{toolLabel ? `${toolLabel} bots` : "The bot directory"}</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-muted">
          Review a pasted diff, plan, or thread. Open the prompt in the assistant you already use.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block max-w-md">
          <span className="sr-only">Search</span>
          <TextInput type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reviewers" />
        </label>
        <div className="flex flex-wrap gap-2" aria-label="Filter by specialty">
          <button type="button" className="filter-chip" aria-pressed={specialty === "all"} onClick={() => setSpecialty("all")}>All</button>
          {SPECIALTIES.map((item) => (
            <button key={item} type="button" className="filter-chip" aria-pressed={specialty === item} onClick={() => setSpecialty(item)}>
              {SPECIALTY_LABEL[item]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Filter by tool">
          <Link href="/bots" className="filter-chip" aria-current={integration ? undefined : "page"}>All tools</Link>
          {BOT_INTEGRATIONS.map((item) => (
            <Link key={item.slug} href={`/bots/integrations/${item.slug}`} className="filter-chip" aria-current={integration === item.slug ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {pending && <p className="text-sm text-ink-muted">Loading bots…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      {bots && bots.length === 0 && <p className="text-sm text-ink-muted">No bots published yet.</p>}
      {Boolean(bots?.length) && listedBots.length === 0 && (
        <div className="rounded-xl border border-line bg-canvas-elevated p-6">
          <h2 className="font-semibold">No bots match that search</h2>
          <p className="my-2 text-sm text-ink-muted">Try a broader task, another specialty, or another tool.</p>
          <Button variant="secondary" onClick={onClear}>Clear filters</Button>
        </div>
      )}

      {listedBots.length > 0 && <CatalogTable bots={listedBots} />}
    </main>
  );
}

function CatalogTable({ bots }: { bots: Bot[] }) {
  return (
    <div className="directory-rows" role="table" aria-label="Reviewers">
      <div className="directory-row directory-row-head" role="row">
        <span role="columnheader">Reviewer</span>
        <span role="columnheader">Specialty</span>
        <span role="columnheader">Tools</span>
        <span role="columnheader"><span className="sr-only">Open</span></span>
      </div>
      {bots.map((bot) => (
        <div className="directory-row" role="row" key={bot.id}>
          <div className="directory-name" role="cell">
            <Link href={`/bots/${bot.id}`} className="directory-bot-name">{bot.name}</Link>
            <p className="directory-bot-desc">{bot.description || "No description"}</p>
          </div>
          <div className="directory-specialty" role="cell"><SpecialtyPill specialty={bot.specialty} /></div>
          <div className="directory-tools-cell" role="cell"><ToolNames slugs={bot.integrations} /></div>
          <Link href={`/bots/${bot.id}`} className="directory-open">Open</Link>
        </div>
      ))}
    </div>
  );
}

function SpecialtyPill({ specialty }: { specialty: string }) {
  const known = specialty in SPECIALTY_LABEL;
  const label = known ? SPECIALTY_LABEL[specialty as Specialty] : specialty;
  return <span className={`directory-pill ${known ? `directory-pill-${specialty}` : "directory-pill-general"}`}>{label}</span>;
}

function ToolNames({ slugs }: { slugs?: BotIntegration[] }) {
  const tools = slugs ?? [];
  if (!tools.length) return null;
  return (
    <ul className="directory-tools">
      {tools.map((slug) => {
        const label = BOT_INTEGRATIONS.find((item) => item.slug === slug)?.label ?? slug;
        return (
          <li key={slug}>
            <Link href={`/bots/integrations/${slug}`}>{label}</Link>
          </li>
        );
      })}
    </ul>
  );
}

function IntegrationLinks({ slugs }: { slugs?: BotIntegration[] }) {
  if (!slugs?.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2" aria-label="Tools">
      {slugs.map((slug) => {
        const label = BOT_INTEGRATIONS.find((item) => item.slug === slug)?.label ?? slug;
        return (
          <li key={slug}>
            <Link href={`/bots/integrations/${slug}`} className="filter-chip">{label}</Link>
          </li>
        );
      })}
    </ul>
  );
}
