"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ensureCsrfCookie, type SwarmSchedule } from "@/lib/api";
import { Button, FieldLabel, LinkButton, Select, TextArea, TextInput } from "@/components/ui";

const timezones = ["UTC", "America/Los_Angeles", "America/New_York", "Europe/London", "Europe/Berlin", "Asia/Dhaka", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"];
const cadencePresets = [
  { label: "Hourly", cron: "0 * * * *", description: "Every hour, at minute 0" },
  { label: "Daily", cron: "0 9 * * *", description: "Every day at 09:00" },
  { label: "Weekdays", cron: "0 9 * * 1-5", description: "Monday through Friday at 09:00" },
  { label: "Weekly", cron: "0 9 * * 1", description: "Every Monday at 09:00" },
];

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
    mutationFn: async () => {
      await ensureCsrfCookie();
      return apiFetch<SwarmSchedule>("/api/schedules", {
        method: "POST",
        body: JSON.stringify({
          name,
          cronExpression,
          timezone,
          scope: { kind: "iac_text", format: "auto", content },
          webhookUrl: webhookUrl || null,
        }),
      });
    },
    onSuccess: () => {
      setContent("");
      void queryClient.invalidateQueries({ queryKey: ["swarm-schedules"] });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      await ensureCsrfCookie();
      return apiFetch<SwarmSchedule>(`/api/schedules/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["swarm-schedules"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await ensureCsrfCookie();
      return apiFetch<void>(`/api/schedules/${id}`, { method: "DELETE" });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["swarm-schedules"] }),
  });

  return (
    <main className="space-y-8">
      <div className="workspace-intro">
        <p className="workspace-kicker">Review / Make it repeatable</p>
        <h1 className="workspace-heading">Scheduled audits</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Rerun a saved infrastructure scope on your timetable. Choose a cadence and timezone,
          then add a webhook if you want completion or failure alerts.
        </p>
      </div>

      <section className="rounded-[10px] border border-line bg-canvas-elevated p-5">
        <h2 className="text-lg font-semibold text-ink">Create a schedule</h2>
        <fieldset className="mt-5"><legend className="text-sm font-medium">Choose a cadence</legend><div className="mt-2 flex flex-wrap gap-2">{cadencePresets.map((preset) => <button key={preset.label} type="button" className="filter-chip" aria-pressed={cronExpression === preset.cron} onClick={() => setCronExpression(preset.cron)}>{preset.label}</button>)}</div></fieldset>
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
        <div className="mt-4 rounded-lg border border-accent/30 bg-accent-soft p-4" role="status">
          <p className="text-sm font-semibold">{cadencePresets.find((preset) => preset.cron === cronExpression)?.description ?? "Custom cron schedule"} · {timezone}</p>
          <p className="mt-1 text-xs text-ink-muted">{cadencePresets.some((preset) => preset.cron === cronExpression) ? "Scheduled times use the timezone you selected." : "Five fields: minute, hour, day of month, month, day of week. The server validates custom expressions when you save."} Dispatch can run up to five minutes after the target time.</p>
        </div>
        <label className="mt-4 block">
          <FieldLabel>IaC content</FieldLabel>
          <TextArea value={content} onChange={(event) => setContent(event.target.value)} className="mt-1 min-h-32" placeholder={'resource "aws_security_group" "web" {}'} aria-label="Scheduled IaC content" />
          <span className="mt-2 block text-xs text-ink-muted">Each run reviews this saved text. It does not pull fresh configuration from your repository or cloud account.</span>
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="button" disabled={!name.trim() || !cronExpression.trim() || !content.trim() || create.isPending} onClick={() => create.mutate()}>
            {create.isPending ? "Saving…" : "Create schedule"}
          </Button>
          {create.isError && <p className="text-sm text-danger">{create.error.message}</p>}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-ink">Your schedules</h2><LinkButton href="/jobs" variant="secondary">View audit results</LinkButton></div>
        {(update.isError || remove.isError) && <p role="alert" className="text-sm text-danger">{update.error?.message ?? remove.error?.message}</p>}
        {schedules.isPending && <p className="text-sm text-ink-muted">Loading schedules…</p>}
        {schedules.isError && (
          <div className="rounded-[10px] border border-line p-4">
            <p className="text-sm text-danger">{schedules.error.message}</p>
            <p className="mt-2 text-sm text-ink-muted">Use Google sign-in in the header to manage your schedules.</p>
          </div>
        )}
        {schedules.data?.length === 0 && <p className="rounded-xl border border-dashed border-line p-6 text-sm text-ink-muted">No recurring reviews yet. Pick a cadence above and save the infrastructure text you want to revisit.</p>}
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
