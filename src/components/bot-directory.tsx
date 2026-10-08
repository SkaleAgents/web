"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, BOT_INTEGRATIONS, SPECIALTIES, type Bot, type BotIntegration, type Specialty } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { Button, LinkButton, TextInput } from "@/components/ui";
import { ToolLogo } from "@/components/tool-logo";
import { personalDestinationFromPath } from "@/lib/dashboard-routes";

const PAGE_SIZE = 20;

const SPECIALTY_LABEL: Record<Specialty, string> = {
  devops: "DevOps",
  devsecops: "DevSecOps",
  sre: "SRE",
  mlops: "MLOps",
  scaling: "Scaling",
  general: "General",
};

export function BotDirectory({ manage = false, initialBots, integration, specialty: specialtyPage }: { manage?: boolean; initialBots?: Bot[]; integration?: BotIntegration; specialty?: Specialty }) {
  const pathname = usePathname();
  const personalHref = (section: string) => personalDestinationFromPath(pathname, section);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [selectedTool, setSelectedTool] = useState<BotIntegration | "all">("all");
  const [pickedSpecialties, setPickedSpecialties] = useState<Specialty[]>(specialtyPage ? [specialtyPage] : []);
  const [pickedTools, setPickedTools] = useState<BotIntegration[]>(integration ? [integration] : []);
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
  const basePath = manage ? personalHref("bots") : "/bot-directory";
  const specialties = [...new Set(bots?.map((bot) => bot.specialty) ?? [])].sort();
  const filteredBots = bots?.filter((bot) => {
    const haystack = `${bot.name} ${bot.description} ${bot.specialty} ${(bot.integrations ?? []).join(" ")}`.toLowerCase();
    if (!haystack.includes(search.trim().toLowerCase())) return false;
    if (!manage) {
      const specialtyOk = pickedSpecialties.length === 0 || pickedSpecialties.includes(bot.specialty);
      const toolOk = pickedTools.length === 0 || pickedTools.some((tool) => (bot.integrations ?? []).includes(tool));
      return specialtyOk && toolOk;
    }
    return (specialty === "all" || bot.specialty === specialty) && (!activeTool || (bot.integrations ?? []).includes(activeTool));
  });
  const toolLabel = BOT_INTEGRATIONS.find((item) => item.slug === integration)?.label;
  const specialtyLabel = specialtyPage ? SPECIALTY_LABEL[specialtyPage] : undefined;
  const listedBots = [...(filteredBots ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  if (!manage) {
    return (
      <CatalogIndex
        bots={bots}
        listedBots={listedBots}
        pending={botsQuery.isPending}
        error={botsQuery.isError ? (botsQuery.error instanceof Error ? botsQuery.error.message : "Failed to load") : null}
        search={search}
        onSearch={setSearch}
        specialties={pickedSpecialties}
        onSpecialties={setPickedSpecialties}
        tools={pickedTools}
        onTools={setPickedTools}
        toolLabel={toolLabel}
        specialtyLabel={specialtyLabel}
        onClear={() => { setSearch(""); setPickedSpecialties([]); setPickedTools([]); }}
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
        <LinkButton href={manage ? personalHref("studio") : "/me/bots"}>{manage ? "Create bot" : "Manage your bots"}</LinkButton>
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
              <Link href="/bot-directory" className="filter-chip" aria-current={integration ? undefined : "page"}>All tools</Link>
              {BOT_INTEGRATIONS.map((item) => (
                <Link key={item.slug} href={`/bot-directory/integrations/${item.slug}`} className="filter-chip" aria-current={integration === item.slug ? "page" : undefined}>
                  {item.label}
                </Link>
              ))}
              <Link href="/bot-directory/integrations" className="filter-chip">Browse by tool</Link>
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
        <p className="text-sm text-ink-muted">No bots yet. Create a draft in Studio to start your own collection.</p>
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
  onSearch,
  specialties,
  onSpecialties,
  tools,
  onTools,
  toolLabel,
  specialtyLabel,
  onClear,
}: {
  bots?: Bot[];
  listedBots: Bot[];
  pending: boolean;
  error: string | null;
  search: string;
  onSearch: (value: string) => void;
  specialties: Specialty[];
  onSpecialties: (value: Specialty[]) => void;
  tools: BotIntegration[];
  onTools: (value: BotIntegration[]) => void;
  toolLabel?: string;
  specialtyLabel?: string;
  onClear: () => void;
}) {
  const filterKey = `${search}|${specialties.join(",")}|${tools.join(",")}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const pageCount = Math.max(1, Math.ceil(listedBots.length / PAGE_SIZE));
  const page = Math.min(pageState.key === filterKey ? pageState.page : 1, pageCount);
  const start = (page - 1) * PAGE_SIZE;
  const visibleBots = listedBots.slice(start, start + PAGE_SIZE);

  function setPage(next: number) {
    setPageState({ key: filterKey, page: next });
  }

  return (
    <main className="directory-index space-y-6">
      <div className="workspace-intro">
        <h1 className="workspace-heading">{toolLabel ? `${toolLabel} bots` : specialtyLabel ? `${specialtyLabel} reviewers` : "The bot directory"}</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-muted">
          Review a pasted diff, plan, or thread. Open the prompt in the assistant you already use.
        </p>
        {!toolLabel && !specialtyLabel && (
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
            <Link href="/bot-directory/specialties" className="text-ink underline">Browse by specialty</Link>
            <Link href="/bot-directory/integrations" className="text-ink underline">Browse by tool</Link>
          </p>
        )}
      </div>

      <DirectoryToolbar
        key={search}
        search={search}
        onSearch={onSearch}
        specialties={specialties}
        onSpecialties={onSpecialties}
        tools={tools}
        onTools={onTools}
      />

      {pending && <p className="text-sm text-ink-muted">Loading bots…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      {bots && bots.length === 0 && <p className="text-sm text-ink-muted">No bots published yet.</p>}
      {Boolean(bots?.length) && listedBots.length === 0 && (
        <div className="rounded-xl border border-line bg-canvas-elevated p-6">
          <h2 className="font-semibold">{specialtyLabel ? `No ${specialtyLabel} reviewers yet` : "No bots match that search"}</h2>
          <p className="my-2 text-sm text-ink-muted">
            {specialtyLabel
              ? "Pick another specialty, or browse the full directory."
              : "Try a broader task, another specialty, or another tool."}
          </p>
          {specialtyLabel ? (
            <LinkButton href="/bot-directory/specialties" variant="secondary">All specialties</LinkButton>
          ) : (
            <Button variant="secondary" onClick={onClear}>Clear filters</Button>
          )}
        </div>
      )}

      {listedBots.length > 0 && (
        <>
          <CatalogTable bots={visibleBots} />
          {(toolLabel || specialtyLabel) && (
            <p>
              <Link href="/bot-directory" className="group inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
                <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 shrink-0">
                  <path d="M10 3.2 5.2 8 10 12.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="group-hover:underline">Back to bot-directory</span>
              </Link>
            </p>
          )}
          <DirectoryPager page={page} pageCount={pageCount} total={listedBots.length} onPage={setPage} />
        </>
      )}
    </main>
  );
}

function DirectoryToolbar({
  search,
  onSearch,
  specialties,
  onSpecialties,
  tools,
  onTools,
}: {
  search: string;
  onSearch: (value: string) => void;
  specialties: Specialty[];
  onSpecialties: (value: Specialty[]) => void;
  tools: BotIntegration[];
  onTools: (value: BotIntegration[]) => void;
}) {
  const [draft, setDraft] = useState(search);

  return (
    <div className="directory-toolbar">
      <form
        className="directory-search"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(draft);
        }}
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">Search</span>
          <TextInput type="search" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search reviewers" />
        </label>
        <Button type="submit">Go</Button>
      </form>
      <div className="directory-filters">
        <MultiFilter
          label="Specialty"
          menuLabel="Filter by specialty"
          options={SPECIALTIES.map((item) => ({ value: item, label: SPECIALTY_LABEL[item] }))}
          selected={specialties}
          onChange={(value) => onSpecialties(value as Specialty[])}
        />
        <MultiFilter
          label="Tool"
          menuLabel="Filter by tool"
          options={BOT_INTEGRATIONS.map((item) => ({ value: item.slug, label: item.label, logo: item.slug }))}
          selected={tools}
          onChange={(value) => onTools(value as BotIntegration[])}
        />
      </div>
    </div>
  );
}

function MultiFilter({
  label,
  menuLabel,
  options,
  selected,
  onChange,
}: {
  label: string;
  menuLabel: string;
  options: { value: string; label: string; logo?: BotIntegration }[];
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const valueId = useId();
  const menuId = useId();
  const chosen = options.filter((option) => selected.includes(option.value)).map((option) => option.label);
  const summary = chosen.length === 0 ? "Any" : chosen.length === 1 ? chosen[0] : `${chosen.length} selected`;

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }

  return (
    <div className="directory-filter" ref={rootRef} aria-label={menuLabel}>
      <span className="directory-filter-label" id={labelId}>{label}</span>
      <button
        type="button"
        className="directory-filter-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-labelledby={`${labelId} ${valueId}`}
        onClick={() => setOpen((current) => !current)}
      >
        <span id={valueId} className="directory-filter-value">{summary}</span>
        <svg aria-hidden="true" viewBox="0 0 16 16" className="directory-filter-chevron">
          <path d="M4 6.2 8 10l4-3.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="directory-menu" id={menuId} role="listbox" aria-multiselectable="true" aria-label={menuLabel}>
          {options.map((option) => {
            const on = selected.includes(option.value);
            return (
              <button key={option.value} type="button" role="option" aria-selected={on} onClick={() => toggle(option.value)}>
                <span className="directory-check" aria-hidden="true" />
                {option.logo && <ToolLogo slug={option.logo} />}
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const wanted = [1, pageCount, page - 1, page, page + 1].filter((number) => number >= 1 && number <= pageCount);
  const sorted = [...new Set(wanted)].sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  for (const number of sorted) {
    const previous = items[items.length - 1];
    if (typeof previous === "number" && number - previous > 1) items.push("gap");
    items.push(number);
  }
  return items;
}

function DirectoryPager({ page, pageCount, total, onPage }: { page: number; pageCount: number; total: number; onPage: (page: number) => void }) {
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="directory-pager">
      <p className="text-sm text-ink-muted">{`Showing ${start}\u2013${end} of ${total}`}</p>
      {pageCount > 1 && (
        <nav className="directory-pages" aria-label="Pagination">
          <button type="button" className="directory-page" disabled={page === 1} onClick={() => onPage(page - 1)}>Previous</button>
          {pageWindow(page, pageCount).map((item, index) => item === "gap"
            ? <span key={`gap-${index}`} className="directory-page-gap" aria-hidden="true">…</span>
            : <button key={item} type="button" className="directory-page" aria-label={`Page ${item}`} aria-current={item === page ? "page" : undefined} onClick={() => onPage(item)}>{item}</button>)}
          <button type="button" className="directory-page" disabled={page === pageCount} onClick={() => onPage(page + 1)}>Next</button>
        </nav>
      )}
    </div>
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
            <Link href={`/bot-directory/${bot.id}`} className="directory-bot-name">{bot.name}</Link>
            <p className="directory-bot-desc">{bot.description || "No description"}</p>
          </div>
          <div className="directory-specialty" role="cell">
            <SpecialtyPill specialty={bot.specialty} href={`/bot-directory/specialties/${bot.specialty}`} />
          </div>
          <div className="directory-tools-cell" role="cell"><ToolNames slugs={bot.integrations} /></div>
          <Link href={`/bot-directory/${bot.id}`} className="directory-open">Open</Link>
        </div>
      ))}
    </div>
  );
}

function SpecialtyPill({ specialty, href }: { specialty: string; href?: string }) {
  const known = specialty in SPECIALTY_LABEL;
  const label = known ? SPECIALTY_LABEL[specialty as Specialty] : specialty;
  const className = `directory-pill ${known ? `directory-pill-${specialty}` : "directory-pill-general"}`;
  if (!href) return <span className={className}>{label}</span>;
  return <Link href={href} className={className}>{label}</Link>;
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
            <Link href={`/bot-directory/integrations/${slug}`} className="directory-tool">
              <ToolLogo slug={slug} />
              <span>{label}</span>
            </Link>
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
            <Link href={`/bot-directory/integrations/${slug}`} className="filter-chip">{label}</Link>
          </li>
        );
      })}
    </ul>
  );
}
