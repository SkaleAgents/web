"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  apiFetch,
  ensureCsrfCookie,
  googleSignInHref,
  type ApiUser,
  type Prompt,
} from "@/lib/api";
import { GoogleSignInLabel } from "@/components/google-mark";
import { parsePromptTags } from "@/lib/tags";
import { Button, TextInput } from "@/components/ui";

const schema = z.object({
  title: z.string().min(1, "Title required"),
  body: z.string().min(1, "Body required"),
  tags: z.string(),
});

type FormValues = z.infer<typeof schema>;

export default function PromptsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: async (): Promise<ApiUser | null> => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082";
      const res = await fetch(`${API_URL}/api/user`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(res.statusText);
      return res.json() as Promise<ApiUser>;
    },
  });

  const promptsQuery = useQuery({
    queryKey: ["prompts", userQuery.data?.id ?? "guest"],
    queryFn: async () => {
      const data = await apiFetch<{ prompts: Prompt[] }>("/api/prompts");
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

  const tags = [...new Set(promptsQuery.data?.flatMap((prompt) => prompt.tags) ?? [])].sort();
  const filteredPrompts = promptsQuery.data?.filter((prompt) =>
    (tag === null || prompt.tags.includes(tag)) &&
    `${prompt.title} ${prompt.body} ${prompt.tags.join(" ")}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  async function copyPrompt(body: string) {
    try {
      await navigator.clipboard.writeText(body);
      toast.success("Prompt copied. Paste it into your assistant and add your context.");
    } catch {
      toast.error("Could not copy. Open the prompt and select the text.");
    }
  }

  return (
    <main className="space-y-8">
      <div className="workspace-intro">
        <p className="workspace-kicker">Explore / Your next starting point</p>
        <h1 className="workspace-heading">Prompt library</h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-muted">
          Pick a task, copy the instructions, and add your project context in your assistant.
          Save the prompts you write here so the next review starts with less setup.
        </p>
      </div>

      <section aria-label="Find a prompt" className="space-y-4">
        <label className="block max-w-xl space-y-2 text-sm font-semibold"><span>Find instructions for your task</span><TextInput type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search titles, prompt text, or tags" /></label>
        <div className="flex flex-wrap gap-2"><button type="button" className="filter-chip" aria-pressed={tag === null} onClick={() => setTag(null)}>All topics</button>{tags.map((item) => <button key={item} type="button" className="filter-chip" aria-pressed={tag === item} onClick={() => setTag(item)}>{item}</button>)}</div>
        {promptsQuery.data && <p role="status" className="text-sm text-ink-muted">{filteredPrompts?.length} of {promptsQuery.data.length} prompts</p>}
      </section>

      {userQuery.data ? (
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
        <p className="text-sm text-ink-muted">
          <Link href={googleSignInHref()} className="underline">
            <GoogleSignInLabel>Sign in</GoogleSignInLabel>
          </Link>{" "}
          to add your own prompts. Community prompts stay readable for free.
        </p>
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
      <ul className="grid gap-4 sm:grid-cols-2">
        {filteredPrompts?.map((prompt) => (
          <li key={prompt.id} className="space-y-4 rounded-xl border border-line bg-canvas-elevated p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-medium">{prompt.title}</h2>
              <span className="text-xs uppercase tracking-wide text-ink-muted">
                {prompt.ownerUserId ? "yours" : "community"}
              </span>
            </div>
            <p className="line-clamp-3 text-sm leading-relaxed text-ink-muted">{prompt.body}</p>
            <details><summary className="cursor-pointer text-sm font-semibold">Read full prompt</summary>
            <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-sm text-ink">
              {prompt.body}
            </pre>
            </details>
            {prompt.tags.length > 0 && (
              <p className="text-xs text-ink-muted">{prompt.tags.join(" · ")}</p>
            )}
            <Button type="button" variant="secondary" onClick={() => void copyPrompt(prompt.body)}>Copy prompt</Button>
          </li>
        ))}
      </ul>
    </main>
  );
}
