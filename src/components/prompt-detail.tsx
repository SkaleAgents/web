"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, type Prompt } from "@/lib/api";
import { BotPromptActions } from "@/components/bot-prompt-actions";
import { LinkButton } from "@/components/ui";
import { promptCategoryLabel, promptType } from "@/lib/prompt-labels";
import { absoluteMarkdown } from "@/lib/site-url";

export function PromptDetail({ initialPrompt }: { initialPrompt?: Prompt }) {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const promptsQuery = useQuery({
    queryKey: ["prompts", "public"],
    initialData: initialPrompt ? [initialPrompt] : undefined,
    queryFn: async ({ signal }) => {
      const data = await apiFetch<{ prompts: Prompt[] }>("/api/prompts", { signal, credentials: "omit" });
      return data.prompts;
    },
  });
  const prompt = promptsQuery.data?.find((item) => item.id === id && !item.ownerUserId);

  if (promptsQuery.isPending) {
    return <p className="text-sm text-ink-muted">Loading prompt…</p>;
  }

  if (!prompt) {
    return (
      <main className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-ink">Prompt not found</h1>
        <p className="text-sm text-ink-muted">It may have been removed, or the link is wrong.</p>
        <Link href="/prompts" className="text-sm font-semibold text-ink underline">Back to the library</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">
            <Link href="/prompts" className="hover:text-ink hover:underline">Prompt library</Link>
            <span aria-hidden="true"> / </span>
            Prompt
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">{prompt.title}</h1>
          <p className="mt-3 text-sm text-ink-muted">Type <span className="text-ink">{promptType(prompt.ownerUserId)}</span></p>
          <p className="text-sm text-ink-muted">Category <span className="text-ink">{promptCategoryLabel(prompt.tags)}</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/prompts" variant="secondary">Back to library</LinkButton>
          <BotPromptActions title={prompt.title} prompt={prompt.body} markdownUrl={absoluteMarkdown(`/prompts/${prompt.id}`)} />
        </div>
      </div>
      <pre className="whitespace-pre-wrap break-words rounded-[10px] border border-line bg-canvas-elevated p-6 font-mono text-sm leading-6 text-ink">{prompt.body}</pre>
    </main>
  );
}
