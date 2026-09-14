"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, googleSignInHref, type SwarmSchedule } from "@/lib/api";
import { GoogleSignInLabel } from "@/components/google-mark";
import { Button, FieldLabel, LinkButton, Select, TextArea, TextInput } from "@/components/ui";

const timezones = ["UTC", "America/Los_Angeles", "America/New_York", "Europe/London"];

export default function SchedulesPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("Hourly security review");
  const [cronExpression, setCronExpression] = useState("0 * * * *");
  const [timezone, setTimezone] = useState("UTC");
  const [content, setContent] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const schedules = useQuery({
    queryKey: ["swarm-schedules"],
    queryFn: async () => (await apiFetch<{ schedules: SwarmSchedule[] }>("/api/schedules")).schedules,
  });

  const create = useMutation({
    mutationFn: () => apiFetch<SwarmSchedule>("/api/schedules", {
      method: "POST",
      body: JSON.stringify({
        name,
        cronExpression,
        timezone,
        scope: { kind: "iac_text", format: "auto", content },
        webhookUrl: webhookUrl || null,
      }),
    }),
    onSuccess: () => {
      setContent("");
      void queryClient.invalidateQueries({ queryKey: ["swarm-schedules"] });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => apiFetch<SwarmSchedule>(`/api/schedules/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["swarm-schedules"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/schedules/${id}`, { method: "DELETE" }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["swarm-schedules"] }),
  });

  return (
    <main className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-accent">Phase 3 monitoring</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Scheduled audits</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Run recurring user-owned audits and receive completion or failure alerts by webhook.
          Workspace-level schedules and email alerts remain future work.
        </p>
      </div>

      <section className="rounded-[10px] border border-line bg-canvas-elevated p-5">
        <h2 className="text-lg font-semibold text-ink">Create a schedule</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label>
            <FieldLabel>Schedule name</FieldLabel>
            <TextInput value={name} onChange={(event) => setName(event.target.value)} className="mt-1" />
          </label>
          <label>
            <FieldLabel>Cron expression</FieldLabel>
            <TextInput value={cronExpression} onChange={(event) => setCronExpression(event.target.value)} className="mt-1 font-mono" />
          </label>
          <label>
            <FieldLabel>Timezone</FieldLabel>
            <Select value={timezone} onChange={(event) => setTimezone(event.target.value)} className="mt-1">
              {timezones.map((option) => <option key={option}>{option}</option>)}
            </Select>
          </label>
          <label>
            <FieldLabel>Alert webhook URL (optional)</FieldLabel>
            <TextInput value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} placeholder="https://hooks.example.com/..." className="mt-1" type="url" />
          </label>
        </div>
        <label className="mt-4 block">
          <FieldLabel>IaC content</FieldLabel>
          <TextArea value={content} onChange={(event) => setContent(event.target.value)} className="mt-1 min-h-32" placeholder={'resource "aws_security_group" "web" {}'} aria-label="Scheduled IaC content" />
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="button" disabled={!name.trim() || !cronExpression.trim() || !content.trim() || create.isPending} onClick={() => create.mutate()}>
            {create.isPending ? "Saving…" : "Create schedule"}
          </Button>
          {create.isError && <p className="text-sm text-danger">{create.error.message}</p>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Your schedules</h2>
        {schedules.isPending && <p className="text-sm text-ink-muted">Loading schedules…</p>}
        {schedules.isError && (
          <div className="rounded-[10px] border border-line p-4">
            <p className="text-sm text-danger">{schedules.error.message}</p>
            <LinkButton href={googleSignInHref()} className="mt-3">
              <GoogleSignInLabel>Sign in</GoogleSignInLabel>
            </LinkButton>
          </div>
        )}
        {schedules.data?.length === 0 && <p className="text-sm text-ink-muted">No schedules yet.</p>}
        <ul className="divide-y divide-line">
          {schedules.data?.map((schedule) => (
            <li key={schedule.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="font-semibold text-ink">{schedule.name}</p>
                <p className="mt-1 font-mono text-xs text-ink-muted">{schedule.cronExpression} · {schedule.timezone} · {schedule.enabled ? "enabled" : "paused"}</p>
                <p className="mt-1 text-xs text-ink-muted">Next run: {schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleString() : "paused"}{schedule.webhookConfigured ? " · webhook enabled" : ""}</p>
                {schedule.lastError && <p className="mt-1 text-xs text-danger">{schedule.lastError}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" disabled={update.isPending} onClick={() => update.mutate({ id: schedule.id, enabled: !schedule.enabled })}>
                  {schedule.enabled ? "Pause" : "Resume"}
                </Button>
                <Button type="button" variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate(schedule.id)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
