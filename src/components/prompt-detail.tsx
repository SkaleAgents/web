"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, type Prompt } from "@/lib/api";
import { Button, LinkButton } from "@/components/ui";

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

  async function copyPrompt(body: string) {
    try {
      await navigator.clipboard.writeText(body);
      toast.success("Prompt copied. Paste it into your assistant and add your context.");
    } catch {
      toast.error("Could not copy. Select the prompt text instead.");
    }
  }

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
          {prompt.tags.length > 0 && <p className="mt-2 text-xs text-ink-muted">{prompt.tags.join(" · ")}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/prompts" variant="secondary">Back to library</LinkButton>
          <Button type="button" onClick={() => void copyPrompt(prompt.body)}>Copy prompt</Button>
        </div>
      </div>
      <pre className="whitespace-pre-wrap break-words rounded-[10px] border border-line bg-canvas-elevated p-6 font-mono text-sm leading-6 text-ink">{prompt.body}</pre>
    </main>
  );
}
