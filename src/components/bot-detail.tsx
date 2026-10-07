"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BotPromptActions } from "@/components/bot-prompt-actions";
import { ToolLogo } from "@/components/tool-logo";
import { apiFetch, BOT_INTEGRATIONS, type Bot, type BotIntegration, type Specialty } from "@/lib/api";
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

export function BotDetail({ manage = false, initialBot }: { manage?: boolean; initialBot?: Bot }) {
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
        <Link href={directory} className="text-sm font-semibold text-ink underline">
          Back to directory
        </Link>
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
        <Link href={directory} className="text-sm font-semibold text-ink underline">
          Back to directory
        </Link>
      </main>
    );
  }

  const category = bot.specialty in SPECIALTY_LABEL ? SPECIALTY_LABEL[bot.specialty] : bot.specialty;

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <p>
        <Link href={directory} className="text-sm text-ink-muted hover:text-ink hover:underline">
          {manage ? "Back to my bots" : "Back to directory"}
        </Link>
      </p>
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          {bot.name}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {bot.description || "No description"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink-muted">Category</span>
          <span className={`directory-pill directory-pill-${bot.specialty}`}>{category}</span>
        </div>
        {(bot.integrations ?? []).length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-muted">Tools</span>
            <ToolMarks slugs={bot.integrations} />
          </div>
        )}
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
    </main>
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
