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
  googleSignInHref,
  type ApiUser,
  type Prompt,
} from "@/lib/api";
import { GoogleSignInLabel } from "@/components/google-mark";
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
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Prompt library</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Community prompts for everyone; your own prompts when signed in.
        </p>
      </div>

      {userQuery.data ? (
        <form
          className="max-w-xl space-y-3 border-b border-line pb-8"
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

      <ul className="divide-y divide-line">
        {promptsQuery.data?.map((prompt) => (
          <li key={prompt.id} className="space-y-2 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-medium">{prompt.title}</h2>
              <span className="text-xs uppercase tracking-wide text-ink-muted">
                {prompt.ownerUserId ? "yours" : "community"}
              </span>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-sm text-ink">
              {prompt.body}
            </pre>
            {prompt.tags.length > 0 && (
              <p className="text-xs text-ink-muted">{prompt.tags.join(" · ")}</p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
