"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { currentUserOptions } from "@/lib/session";
import {
  apiFetch,
  ensureCsrfCookie,
  SPECIALTIES,
  type Bot,
} from "@/lib/api";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string(),
  specialty: z.enum([
    "devops",
    "devsecops",
    "sre",
    "mlops",
    "scaling",
    "general",
  ]),
  promptBody: z.string().min(1, "Prompt required"),
  visibility: z.enum(["public", "private"]),
});

type FormValues = z.infer<typeof schema>;

export default function StudioEditPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useQuery(currentUserOptions);
  const botKey = ["bot", id, user.data?.id ?? "guest"];

  const botQuery = useQuery({
    queryKey: botKey,
    queryFn: ({ signal }) => apiFetch<Bot>(`/api/bots/${id}`, { signal }),
    enabled: Boolean(id) && !user.isPending,
  });

  const bot = botQuery.data;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      specialty: "general",
      promptBody: "",
      visibility: "private",
    },
  });

  useEffect(() => {
    if (bot) {
      form.reset({
        name: bot.name,
        description: bot.description,
        specialty: bot.specialty,
        promptBody: bot.promptBody,
        visibility: bot.visibility,
      });
    }
  }, [bot, form]);

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      await ensureCsrfCookie();
      return apiFetch<Bot>(`/api/bots/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(botKey, updated);
      void queryClient.invalidateQueries({ queryKey: ["bots"] });
      toast.success("Saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const publish = useMutation({
    mutationFn: async () => {
      const values = form.getValues();
      const parsed = schema.safeParse(values);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid form");
      }
      await ensureCsrfCookie();
      await apiFetch<Bot>(`/api/bots/${id}`, {
        method: "PATCH",
        body: JSON.stringify(parsed.data),
      });
      return apiFetch<Bot>(`/api/bots/${id}/publish`, {
        method: "POST",
        body: "{}",
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bots"] });
      void queryClient.invalidateQueries({ queryKey: botKey });
      toast.success("Published");
      router.push("/me/bots");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (botQuery.isPending) {
    return <p className="text-sm text-ink-muted">Loading…</p>;
  }

  if (botQuery.isError) {
    return (
      <main className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-ink">Couldn’t load bot</h1>
        <p className="text-sm text-danger">
          {botQuery.error instanceof Error
            ? botQuery.error.message
            : "Request failed"}
        </p>
      </main>
    );
  }

  if (!bot) {
    return (
      <main className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-ink">Bot not found</h1>
        <p className="text-sm text-ink-muted">
          It may be private to another user, or the id is wrong.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{bot.name}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {bot.status} · {bot.visibility} · {bot.specialty}
        </p>
      </div>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((v) => save.mutate(v))}
      >
        <label className="block space-y-1 text-sm">
          <span>Name</span>
          <input
            className="w-full rounded-md border border-line bg-canvas-elevated px-3 py-2"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <span className="text-danger">
              {form.formState.errors.name.message}
            </span>
          )}
        </label>
        <label className="block space-y-1 text-sm">
          <span>Description</span>
          <input
            className="w-full rounded-md border border-line bg-canvas-elevated px-3 py-2"
            {...form.register("description")}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Specialty</span>
          <select
            className="w-full rounded-md border border-line bg-canvas-elevated px-3 py-2"
            {...form.register("specialty")}
          >
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span>Prompt body</span>
          <textarea
            rows={6}
            className="w-full rounded-md border border-line bg-canvas-elevated px-3 py-2 font-mono text-sm"
            {...form.register("promptBody")}
          />
          {form.formState.errors.promptBody && (
            <span className="text-danger">
              {form.formState.errors.promptBody.message}
            </span>
          )}
        </label>
        <label className="block space-y-1 text-sm">
          <span>Visibility</span>
          <select
            className="w-full rounded-md border border-line bg-canvas-elevated px-3 py-2"
            {...form.register("visibility")}
          >
            <option value="private">private</option>
            <option value="public">public</option>
          </select>
        </label>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-[10px] border border-line px-4 py-2 text-sm"
          >
            {save.isPending ? "Saving…" : "Save"}
          </button>
          {bot.status !== "published" && (
            <button
              type="button"
              disabled={publish.isPending}
              onClick={() => publish.mutate()}
              className="rounded-[10px] bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
            >
              {publish.isPending ? "Publishing…" : "Publish"}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
