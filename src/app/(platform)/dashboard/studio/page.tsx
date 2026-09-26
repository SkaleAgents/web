"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { studioStarters } from "@/lib/studio-starters";
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
  const [starterIndex, setStarterIndex] = useState("0");
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
      router.push(`/dashboard/studio/${bot.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <main className="space-y-8">
      <div className="workspace-intro">
        <p className="workspace-kicker">Build / Instructions worth reusing</p>
        <h1 className="workspace-heading">
          Creator Studio
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Give your bot a clear job and a repeatable review process. Start with a
          specialist template or write your own instructions, then save a draft to refine before publishing.
        </p>
      </div>
      <section className="grid gap-6 rounded-xl border border-line bg-accent-soft p-5 sm:grid-cols-2">
        <div><h2 className="text-lg font-semibold">Start with a review playbook</h2><p className="mt-2 text-sm text-ink-muted">Each starter includes the context to request, the evidence to cite, and how to validate a finding.</p></div>
        <div className="space-y-3"><label className="block space-y-2 text-sm"><span>Starter template</span><Select value={starterIndex} onChange={(event) => setStarterIndex(event.target.value)}>{studioStarters.map((starter, index) => <option key={starter.name} value={index}>{starter.name}</option>)}</Select></label><Button type="button" variant="secondary" onClick={() => {
          const starter = studioStarters[Number(starterIndex)];
          form.setValue("name", starter.name, { shouldDirty: true });
          form.setValue("description", starter.description, { shouldDirty: true });
          form.setValue("specialty", starter.specialty, { shouldDirty: true });
          form.setValue("promptBody", starter.promptBody, { shouldDirty: true });
        }}>Use starter</Button><p className="text-xs text-ink-muted">Replaces the name, description, specialty, and instructions below.</p></div>
      </section>
      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_16rem]">
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((v) => create.mutate(v))}
      >
        <label className="block space-y-1">
          <FieldLabel>Name</FieldLabel>
          <TextInput placeholder="e.g. Kubernetes release reviewer" {...form.register("name")} />
          {form.formState.errors.name && (
            <span className="text-sm text-danger">
              {form.formState.errors.name.message}
            </span>
          )}
        </label>
        <label className="block space-y-1">
          <FieldLabel>Description</FieldLabel>
          <TextInput placeholder="What should someone bring to this bot?" {...form.register("description")} />
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
          <TextArea rows={12} placeholder="Define the role, required context, review steps, and expected output." {...form.register("promptBody")} />
          {form.formState.errors.promptBody && (
            <span className="text-sm text-danger">
              {form.formState.errors.promptBody.message}
            </span>
          )}
        </label>
        <label className="block space-y-1">
          <FieldLabel>Visibility</FieldLabel>
          <Select {...form.register("visibility")}>
            <option value="private">Private: only you</option>
            <option value="public">Public: listed after publishing</option>
          </Select>
        </label>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Saving…" : "Save draft"}
        </Button>
      </form>
      <aside className="space-y-5 rounded-xl border border-line bg-canvas-elevated p-5 text-sm">
        <p className="workspace-kicker">Before you save</p>
        <div><h2 className="font-semibold">Define the input</h2><p className="mt-1 text-ink-muted">Which files, metrics, or constraints should the bot ask for?</p></div>
        <div><h2 className="font-semibold">Make findings useful</h2><p className="mt-1 text-ink-muted">Ask for a resource reference, operational impact, a focused fix, and a way to verify it.</p></div>
        <div><h2 className="font-semibold">Keep it a draft first</h2><p className="mt-1 text-ink-muted">Saving opens the editor. You decide when to publish and who can see the bot.</p></div>
      </aside>
      </div>
    </main>
  );
}
