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
import {
  Button,
  FieldLabel,
  Select,
  TextArea,
  TextInput,
} from "@/components/ui";

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
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Creator Studio
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Create a draft bot, then publish it to the directory.
        </p>
      </div>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((v) => create.mutate(v))}
      >
        <label className="block space-y-1">
          <FieldLabel>Name</FieldLabel>
          <TextInput {...form.register("name")} />
          {form.formState.errors.name && (
            <span className="text-sm text-danger">
              {form.formState.errors.name.message}
            </span>
          )}
        </label>
        <label className="block space-y-1">
          <FieldLabel>Description</FieldLabel>
          <TextInput {...form.register("description")} />
        </label>
        <label className="block space-y-1">
          <FieldLabel>Specialty</FieldLabel>
          <Select {...form.register("specialty")}>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1">
          <FieldLabel>Prompt body</FieldLabel>
          <TextArea rows={6} {...form.register("promptBody")} />
          {form.formState.errors.promptBody && (
            <span className="text-sm text-danger">
              {form.formState.errors.promptBody.message}
            </span>
          )}
        </label>
        <label className="block space-y-1">
          <FieldLabel>Visibility</FieldLabel>
          <Select {...form.register("visibility")}>
            <option value="private">private</option>
            <option value="public">public</option>
          </Select>
        </label>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Saving…" : "Save draft"}
        </Button>
      </form>
    </main>
  );
}
