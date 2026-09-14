"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BotPromptActions } from "@/components/bot-prompt-actions";
import { apiFetch, type Bot } from "@/lib/api";
import { LinkButton } from "@/components/ui";

export default function BotDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const botQuery = useQuery({
    queryKey: ["bot", id],
    queryFn: () => apiFetch<Bot>(`/api/bots/${id}`),
    enabled: Boolean(id),
  });

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
        <Link href="/bots" className="text-sm font-semibold text-ink underline">
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
        <Link href="/bots" className="text-sm font-semibold text-ink underline">
          Back to directory
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">
            <Link href="/bots" className="hover:text-ink hover:underline">
              Bot directory
            </Link>
            <span aria-hidden="true"> / </span>
            Bot
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
            {bot.name}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {bot.description || "No description"}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <LinkButton href="/bots" variant="secondary">
            Back to directory
          </LinkButton>
          <BotPromptActions prompt={bot.promptBody} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 font-mono text-xs uppercase tracking-wide text-ink-muted">
        <span>{bot.specialty}</span>
        <span>{bot.visibility}</span>
        <span>{bot.status}</span>
      </div>

      <section className="rounded-[10px] border border-line bg-canvas-elevated p-6">
        <div>
          <h2 className="text-xl font-semibold text-ink">Prompt</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Open this prompt in Grok or copy it into another AI assistant.
          </p>
        </div>
        <pre className="mt-5 whitespace-pre-wrap rounded-[10px] border border-line bg-canvas px-4 py-4 font-mono text-sm leading-6 text-ink">
          {bot.promptBody}
        </pre>
      </section>
    </main>
  );
}
