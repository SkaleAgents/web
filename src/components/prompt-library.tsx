"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  apiFetch,
  ensureCsrfCookie,
  type Prompt,
} from "@/lib/api";
import { parsePromptTags } from "@/lib/tags";
import { BotPromptActions } from "@/components/bot-prompt-actions";
import { Button, LinkButton, TextInput } from "@/components/ui";
import { currentUserOptions } from "@/lib/session";
import { absoluteMarkdown } from "@/lib/site-url";
import { personalDestinationFromPath } from "@/lib/dashboard-routes";
import { promptCategories, promptCategoryLabel, promptType } from "@/lib/prompt-labels";

const schema = z.object({
  title: z.string().min(1, "Title required"),
  body: z.string().min(1, "Body required"),
  tags: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function PromptLibrary({ manage = false, initialPrompts }: { manage?: boolean; initialPrompts?: Prompt[] }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const userQuery = useQuery(currentUserOptions);

  const promptsQuery = useQuery({
    queryKey: ["prompts", manage ? userQuery.data?.id ?? "guest" : "public"],
    enabled: !manage || Boolean(userQuery.data),
    initialData: manage ? undefined : initialPrompts,
    queryFn: async ({ signal }) => {
      const data = await apiFetch<{ prompts: Prompt[] }>("/api/prompts", { signal, credentials: manage ? "include" : "omit" });
      return data.prompts;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", body: "", tags: "" },
  });

  const create = useMutation({
    mutationFn: async (values: FormValues) => {
      await ensureCsrfCookie();
      const tags = parsePromptTags(values.tags);
      return apiFetch<Prompt>("/api/prompts", {
        method: "POST",
        body: JSON.stringify({
          title: values.title,
          body: values.body,
          tags,
        }),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["prompts"] });
      form.reset();
      toast.success("Prompt saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const prompts = promptsQuery.data?.filter(prompt => manage ? prompt.ownerUserId === userQuery.data?.id : !prompt.ownerUserId);
  const tags = [...new Set(prompts?.flatMap((prompt) => manage ? prompt.tags : promptCategories(prompt.tags)) ?? [])].sort();
  const filteredPrompts = prompts?.filter((prompt) => {
    const categories = promptCategories(prompt.tags);
    const haystack = manage
      ? `${prompt.title} ${prompt.body} ${prompt.tags.join(" ")}`
      : `${prompt.title} ${prompt.body} ${promptType(prompt.ownerUserId)} ${categories.join(" ")}`;
    return (tag === null || (manage ? prompt.tags.includes(tag) : categories.includes(tag)))
      && haystack.toLowerCase().includes(search.trim().toLowerCase());
  });

  return (
    <main className="space-y-8">
      <div className="workspace-intro">
        <p className="workspace-kicker">Explore / Your next starting point</p>
        <h1 className="workspace-heading">{manage ? "My prompts" : "Prompt library"}</h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-muted">
          {manage
            ? "Pick a task, copy the instructions, and add your project context in your assistant. Save the prompts you write here so the next review starts with less setup."
            : "The list shows the title, type, and category. Open a prompt to read it and copy it. No account required."}
        </p>
      </div>

      <section aria-label="Find a prompt" className="space-y-4">
        <label className="block max-w-xl space-y-2 text-sm font-semibold"><span>Find instructions for your task</span><TextInput type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={manage ? "Search titles, prompt text, or tags" : "Search titles, types, or categories"} /></label>
        <div className="flex flex-wrap gap-2"><button type="button" className="filter-chip" aria-pressed={tag === null} onClick={() => setTag(null)}>{manage ? "All topics" : "All categories"}</button>{tags.map((item) => <button key={item} type="button" className="filter-chip" aria-pressed={tag === item} onClick={() => setTag(item)}>{item}</button>)}</div>
        {prompts && <p role="status" className="text-sm text-ink-muted">{filteredPrompts?.length} of {prompts.length} prompts</p>}
      </section>

      {manage && userQuery.data ? (
        <details className="rounded-xl border border-line bg-canvas-elevated p-5">
        <summary className="cursor-pointer font-semibold">Save your own prompt</summary>
        <form
          className="mt-5 max-w-xl space-y-3"
          onSubmit={form.handleSubmit((v) => create.mutate(v))}
        >
          <h2 className="text-lg font-medium">Add a prompt</h2>
          <label className="block space-y-1 text-sm">
            <span>Title</span>
            <input
              className="w-full rounded-md border border-line bg-canvas-elevated px-3 py-2"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <span className="text-danger">
                {form.formState.errors.title.message}
              </span>
            )}
          </label>
          <label className="block space-y-1 text-sm">
            <span>Body</span>
            <textarea
              rows={4}
              className="w-full rounded-md border border-line bg-canvas-elevated px-3 py-2 font-mono text-sm"
              {...form.register("body")}
            />
            {form.formState.errors.body && (
              <span className="text-danger">
                {form.formState.errors.body.message}
              </span>
            )}
          </label>
          <label className="block space-y-1 text-sm">
            <span>Tags (comma-separated)</span>
            <input
              className="w-full rounded-md border border-line bg-canvas-elevated px-3 py-2"
              placeholder="sre, ops"
              {...form.register("tags")}
            />
          </label>
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-[10px] bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
          >
            {create.isPending ? "Saving…" : "Save prompt"}
          </button>
        </form>
        </details>
      ) : (
        <LinkButton href={manage ? personalDestinationFromPath(pathname, "prompts") : "/me/prompts"} variant="secondary">Manage your prompts</LinkButton>
      )}

      {promptsQuery.isPending && (
        <p className="text-sm text-ink-muted">Loading prompts…</p>
      )}
      {promptsQuery.isError && (
        <p className="text-sm text-danger">
          {promptsQuery.error instanceof Error
            ? promptsQuery.error.message
            : "Failed to load"}
        </p>
      )}

      {filteredPrompts?.length === 0 && <div className="rounded-xl border border-line p-6"><h2 className="font-semibold">No prompts found</h2><p className="my-2 text-sm text-ink-muted">Try another search or save a prompt of your own.</p>{(search || tag !== null) && <Button variant="secondary" onClick={() => { setSearch(""); setTag(null); }}>Clear filters</Button>}</div>}
      {manage ? (
      <ul className="grid gap-4 sm:grid-cols-2">
        {filteredPrompts?.map((prompt) => (
          <li key={prompt.id} className="flex flex-col rounded-xl border border-line bg-canvas-elevated p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-medium">{prompt.title}</h2>
              <span className="text-xs uppercase tracking-wide text-ink-muted">{promptType(prompt.ownerUserId)}</span>
            </div>
            <p className="mt-2 text-xs text-ink-muted">{promptCategoryLabel(prompt.tags)}</p>
            <p className="line-clamp-3 text-sm leading-relaxed text-ink-muted">{prompt.body}</p>
            <details><summary className="cursor-pointer text-sm font-semibold">Read full prompt</summary>
            <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-sm text-ink">{prompt.body}</pre>
            </details>
            <div className="mt-4">
              <BotPromptActions
                title={prompt.title}
                prompt={prompt.body}
                align="left"
                markdownUrl={!manage && !prompt.ownerUserId ? absoluteMarkdown(`/prompts/${prompt.id}`) : undefined}
              />
            </div>
          </li>
        ))}
      </ul>
      ) : (
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-semibold" scope="col">Title</th>
              <th className="px-4 py-3 font-semibold" scope="col">Type</th>
              <th className="px-4 py-3 font-semibold" scope="col">Category</th>
              <th className="px-4 py-3 font-semibold" scope="col">Use it</th>
            </tr>
          </thead>
          <tbody>
            {filteredPrompts?.map((prompt) => (
              <tr key={prompt.id} className="border-t border-line">
                <td className="px-4 py-4">
                  <h2 className="text-base font-medium">
                    <Link href={`/prompts/${prompt.id}`} className="hover:underline">{prompt.title}</Link>
                  </h2>
                </td>
                <td className="px-4 py-4 text-ink-muted">{promptType(prompt.ownerUserId)}</td>
                <td className="px-4 py-4 text-ink-muted">{promptCategoryLabel(prompt.tags)}</td>
                <td className="px-4 py-4">
                  <BotPromptActions
                    title={prompt.title}
                    prompt={prompt.body}
                    align="left"
                    markdownUrl={!manage && !prompt.ownerUserId ? absoluteMarkdown(`/prompts/${prompt.id}`) : undefined}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </main>
  );
}
