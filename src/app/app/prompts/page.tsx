"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  apiFetch,
  ensureCsrfCookie,
  type ApiUser,
  type Prompt,
} from "@/lib/api";
import { parsePromptTags } from "@/lib/tags";

const schema = z.object({
  title: z.string().min(1, "Title required"),
  body: z.string().min(1, "Body required"),
  tags: z.string(),
});

type FormValues = z.infer<typeof schema>;

export default function PromptsPage() {
  const queryClient = useQueryClient();

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

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Prompt library</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Community prompts for everyone; your own prompts when signed in.
        </p>
      </div>

      {userQuery.data ? (
        <form
          className="max-w-xl space-y-3 border-b border-zinc-200 pb-8 dark:border-zinc-800"
          onSubmit={form.handleSubmit((v) => create.mutate(v))}
        >
          <h2 className="text-lg font-medium">Add a prompt</h2>
          <label className="block space-y-1 text-sm">
            <span>Title</span>
            <input
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <span className="text-red-600">
                {form.formState.errors.title.message}
              </span>
            )}
          </label>
          <label className="block space-y-1 text-sm">
            <span>Body</span>
            <textarea
              rows={4}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
              {...form.register("body")}
            />
            {form.formState.errors.body && (
              <span className="text-red-600">
                {form.formState.errors.body.message}
              </span>
            )}
          </label>
          <label className="block space-y-1 text-sm">
            <span>Tags (comma-separated)</span>
            <input
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="sre, ops"
              {...form.register("tags")}
            />
          </label>
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {create.isPending ? "Saving…" : "Save prompt"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/app/login" className="underline">
            Sign in
          </Link>{" "}
          to add your own prompts. Community prompts stay readable for free.
        </p>
      )}

      {promptsQuery.isPending && (
        <p className="text-sm text-zinc-500">Loading prompts…</p>
      )}
      {promptsQuery.isError && (
        <p className="text-sm text-red-600">
          {promptsQuery.error instanceof Error
            ? promptsQuery.error.message
            : "Failed to load"}
        </p>
      )}

      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {promptsQuery.data?.map((prompt) => (
          <li key={prompt.id} className="space-y-2 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-medium">{prompt.title}</h2>
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                {prompt.ownerUserId ? "yours" : "community"}
              </span>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-sm text-zinc-700 dark:text-zinc-300">
              {prompt.body}
            </pre>
            {prompt.tags.length > 0 && (
              <p className="text-xs text-zinc-500">{prompt.tags.join(" · ")}</p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
