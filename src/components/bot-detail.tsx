"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BotPromptActions } from "@/components/bot-prompt-actions";
import { ToolLogo } from "@/components/tool-logo";
import { apiFetch, BOT_INTEGRATIONS, type Bot, type BotIntegration, type Specialty } from "@/lib/api";
import { relatedReviewers } from "@/lib/related-reviewers";
import { currentUserOptions } from "@/lib/session";
import { personalDestinationFromPath } from "@/lib/dashboard-routes";

const SPECIALTY_LABEL: Record<Specialty, string> = {
  devops: "DevOps",
  devsecops: "DevSecOps",
  sre: "SRE",
  mlops: "MLOps",
  scaling: "Scaling",
  general: "General",
};

export function BotDetail({ manage = false, initialBot, initialBots }: { manage?: boolean; initialBot?: Bot; initialBots?: Bot[] }) {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const user = useQuery(currentUserOptions);
  const botQuery = useQuery({
    queryKey: ["bot", id, manage ? user.data?.id ?? "guest" : "public"],
    queryFn: ({ signal }) => apiFetch<Bot>(`/api/bots/${id}`, { signal, credentials: manage ? "include" : "omit" }),
    enabled: Boolean(id) && (!manage || Boolean(user.data)),
    initialData: !manage && initialBot?.id === id ? initialBot : undefined,
  });
  const catalogQuery = useQuery({
    queryKey: ["bots", "public"],
    queryFn: async ({ signal }) => {
      const data = await apiFetch<{ bots: Bot[] }>("/api/bots", { signal, credentials: "omit" });
      return data.bots;
    },
    enabled: !manage,
    initialData: initialBots,
  });
  const directory = manage ? personalDestinationFromPath(pathname, "bots") : "/bot-directory";

  if (botQuery.isPending) {
    return <p className="text-sm text-ink-muted">Loading bot…</p>;
  }

  if (botQuery.isError) {
    return (
      <main className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-ink">Couldn’t load bot</h1>
        <p className="text-sm text-danger">
          {botQuery.error instanceof Error ? botQuery.error.message : "Request failed"}
        </p>
        <BackLink href={directory}>Back to bot-directory</BackLink>
      </main>
    );
  }

  const bot = botQuery.data;
  if (!bot) {
    return (
      <main className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-ink">Bot not found</h1>
        <p className="text-sm text-ink-muted">
          It may be private to another user, or the id is wrong.
        </p>
        <BackLink href={directory}>Back to bot-directory</BackLink>
      </main>
    );
  }

  const category = bot.specialty in SPECIALTY_LABEL ? SPECIALTY_LABEL[bot.specialty] : bot.specialty;

  const related = !manage && catalogQuery.data ? relatedReviewers(catalogQuery.data, bot) : null;

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <p className="flex flex-wrap items-center gap-2">
        <BackLink href={directory}>{manage ? "Back to my bots" : "Back to bot-directory"}</BackLink>
        {!manage && (
          <>
            <span className="text-ink-muted" aria-hidden="true">/</span>
            <Link href={`/bot-directory/specialties/${bot.specialty}`} className="text-sm text-ink-muted hover:text-ink hover:underline">
              {category}
            </Link>
          </>
        )}
      </p>
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          {bot.name}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {bot.description || "No description"}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink-muted">Category</span>
          {manage ? (
            <span className={`directory-pill directory-pill-${bot.specialty}`}>{category}</span>
          ) : (
            <Link href={`/bot-directory/specialties/${bot.specialty}`} className={`directory-pill directory-pill-${bot.specialty}`}>
              {category}
            </Link>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-semibold text-ink-muted">Tools</span>
          {(bot.integrations ?? []).length > 0 ? <ToolMarks slugs={bot.integrations} /> : <span className="text-sm text-ink-muted">None</span>}
        </div>
        {manage && (
          <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">
            {bot.visibility} · {bot.status}
          </p>
        )}
      </div>

      <section className="rounded-[10px] border border-line bg-canvas-elevated p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink">Prompt</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Open this prompt in the assistant you already use.
            </p>
          </div>
          <BotPromptActions title={bot.name} prompt={bot.promptBody} />
        </div>
        <pre className="mt-5 whitespace-pre-wrap break-words rounded-[10px] border border-line bg-canvas px-4 py-4 font-mono text-sm leading-6 text-ink">
          {bot.promptBody}
        </pre>
      </section>

      {!manage && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-ink">How to use it</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-ink">
            <li>Read the prompt. It says which fields to look at, and which to skip when they are missing.</li>
            <li>Open Actions and send it to the assistant you already use.</li>
            <li>Paste your own notes. Leave out a number you do not have.</li>
          </ol>
        </section>
      )}

      {related && related.bots.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-ink">{related.heading}</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-[10px] border border-line bg-canvas-elevated">
            {related.bots.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <Link href={`/bot-directory/${item.id}`} className="font-medium text-ink hover:underline">{item.name}</Link>
                  {item.description && <p className="mt-1 text-sm text-ink-muted">{item.description}</p>}
                </div>
                <ToolMarks slugs={item.integrations} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 shrink-0">
        <path d="M10 3.2 5.2 8 10 12.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="group-hover:underline">{children}</span>
    </Link>
  );
}

function ToolMarks({ slugs }: { slugs?: BotIntegration[] }) {
  const tools = slugs ?? [];
  if (!tools.length) return null;
  return (
    <ul className="directory-tools" aria-label="Tools">
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
