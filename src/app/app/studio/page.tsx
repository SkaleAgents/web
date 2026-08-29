"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

export default function StudioCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
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

  const create = useMutation({
    mutationFn: async (values: FormValues) => {
      await ensureCsrfCookie();
      return apiFetch<Bot>("/api/bots", {
        method: "POST",
        body: JSON.stringify(values),
      });
    },
    onSuccess: (bot) => {
      void queryClient.invalidateQueries({ queryKey: ["bots"] });
      toast.success("Draft created");
      router.push(`/app/studio/${bot.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <main className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Creator Studio</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create a draft bot, then publish it to the directory.
        </p>
      </div>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((v) => create.mutate(v))}
      >
        <Field label="Name" error={form.formState.errors.name?.message}>
          <input
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            {...form.register("name")}
          />
        </Field>
        <Field label="Description">
          <input
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            {...form.register("description")}
          />
        </Field>
        <Field label="Specialty">
          <select
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            {...form.register("specialty")}
          >
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Prompt body"
          error={form.formState.errors.promptBody?.message}
        >
          <textarea
            rows={6}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
            {...form.register("promptBody")}
          />
        </Field>
        <Field label="Visibility">
          <select
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            {...form.register("visibility")}
          >
            <option value="private">private</option>
            <option value="public">public</option>
          </select>
        </Field>
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {create.isPending ? "Saving…" : "Save draft"}
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span>{label}</span>
      {children}
      {error && <span className="text-red-600">{error}</span>}
    </label>
  );
}
