"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ensureCsrfCookie, type SwarmSchedule } from "@/lib/api";
import { Button, FieldLabel, LinkButton, Select, TextArea, TextInput } from "@/components/ui";
import { currentUserOptions } from "@/lib/session";
import { ScheduleDeletionStatus, ScheduleRetentionControls } from "@/components/schedule-retention-controls";
import { SourceMetadata } from "@/components/source-metadata";
import { SourceMetadataFields } from "@/components/source-metadata-fields";
import { buildSourceMetadata } from "@/lib/source-metadata";
import { personalDestinationFromPath } from "@/lib/dashboard-routes";
import { buildGithubScheduleScope, type GithubScheduleFormat } from "@/lib/github-schedule-source";

const timezones = ["UTC", "America/Los_Angeles", "America/New_York", "Europe/London", "Europe/Berlin", "Asia/Dhaka", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"];
const cadencePresets = [
  { label: "Hourly", cron: "0 * * * *", description: "Every hour, at minute 0" },
  { label: "Daily", cron: "0 9 * * *", description: "Every day at 09:00" },
  { label: "Weekdays", cron: "0 9 * * 1-5", description: "Monday through Friday at 09:00" },
  { label: "Weekly", cron: "0 9 * * 1", description: "Every Monday at 09:00" },
];

export default function SchedulesPage() {
  const pathname = usePathname();
  const href = (section: string) => personalDestinationFromPath(pathname, section);
  const queryClient = useQueryClient();
  const user = useQuery(currentUserOptions);
  const schedulesKey = ["swarm-schedules", user.data?.id ?? "guest"];
  const [name, setName] = useState("Hourly security review");
  const [cronExpression, setCronExpression] = useState("0 * * * *");
  const [timezone, setTimezone] = useState("UTC");
  const [content, setContent] = useState("");
  const [sourceMode, setSourceMode] = useState<"text" | "github">("text");
  const [repository, setRepository] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [branch, setBranch] = useState("main");
  const [sourceFormat, setSourceFormat] = useState<GithubScheduleFormat>("auto");
  const [sourceRevision, setSourceRevision] = useState("");
  const [sourceObservedAt, setSourceObservedAt] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [deletions, setDeletions] = useState<Record<string, "pending" | "processing" | "failed" | "completed">>({});

  const schedules = useQuery({
    queryKey: schedulesKey,
    enabled: Boolean(user.data),
    queryFn: async ({ signal }) => (await apiFetch<{ schedules: SwarmSchedule[] }>("/api/schedules", { signal })).schedules,
    refetchInterval: query => query.state.data?.some(schedule => ["pending", "failed"].includes(schedule.retention?.inputPurgeStatus ?? "")) ? 5000 : query.state.data?.some(schedule => schedule.enabled) ? 60000 : false,
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
          scope: sourceMode === "github"
            ? buildGithubScheduleScope(repository, sourcePath, branch, sourceFormat)
            : { kind: "iac_text", format: "auto", content },
          ...(sourceMode === "text" ? buildSourceMetadata(sourceRevision, sourceObservedAt) : {}),
          webhookUrl: webhookUrl || null,
        }),
      });
    },
    onSuccess: () => {
      setContent("");
      setRepository("");
      setSourcePath("");
      setSourceRevision("");
      setSourceObservedAt("");
      void queryClient.invalidateQueries({ queryKey: schedulesKey });
    },
  });

  return (
    <main className="space-y-8">
      <div className="workspace-intro">
        <p className="workspace-kicker">Review / Make it repeatable</p>
        <h1 className="workspace-heading">Scheduled audits</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Review saved infrastructure text or the current file from a public GitHub repository. Choose a cadence and timezone,
          then manage email preferences in <Link href="/account/settings" className="text-accent underline">Settings</Link>.
          Webhooks are optional.
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
        <fieldset className="mt-4"><legend className="text-sm font-medium">Source</legend><div className="mt-2 flex gap-2">
          <Button type="button" variant={sourceMode === "text" ? "primary" : "secondary"} aria-pressed={sourceMode === "text"} onClick={() => setSourceMode("text")}>Saved text</Button>
          <Button type="button" variant={sourceMode === "github" ? "primary" : "secondary"} aria-pressed={sourceMode === "github"} onClick={() => setSourceMode("github")}>Public GitHub file</Button>
        </div></fieldset>
        {sourceMode === "text" ? <>
          <label className="mt-4 block">
            <FieldLabel>IaC content</FieldLabel>
            <TextArea value={content} onChange={(event) => setContent(event.target.value)} className="mt-1 min-h-32" placeholder={'resource "aws_security_group" "web" {}'} aria-label="Scheduled IaC content" />
            <span className="mt-2 block text-xs text-ink-muted">Each run reviews this saved text.</span>
          </label>
          <SourceMetadataFields idPrefix="schedule-source" revision={sourceRevision} observedAt={sourceObservedAt} onRevisionChange={setSourceRevision} onObservedAtChange={setSourceObservedAt} />
        </> : <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label><FieldLabel>Public repository</FieldLabel><TextInput className="mt-1" value={repository} onChange={event => setRepository(event.target.value)} placeholder="owner/repository" /></label>
          <label><FieldLabel>File path</FieldLabel><TextInput className="mt-1" value={sourcePath} onChange={event => setSourcePath(event.target.value)} placeholder="k8s/deployment.yaml" /></label>
          <label><FieldLabel>Branch</FieldLabel><TextInput className="mt-1" value={branch} onChange={event => setBranch(event.target.value)} placeholder="main" /></label>
          <label><FieldLabel>Format</FieldLabel><Select className="mt-1" value={sourceFormat} onChange={event => setSourceFormat(event.target.value as GithubScheduleFormat)}><option value="auto">Auto</option><option value="kubernetes">Kubernetes</option><option value="terraform">Terraform</option><option value="cloudformation">CloudFormation</option></Select></label>
          <p className="text-xs text-ink-muted sm:col-span-2">Each due run fetches this file at the current branch commit. A failed fetch skips the audit and shows an error. Unchanged commits do not create another audit. Public repositories only; maximum file size 256 KiB.</p>
        </div>}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="button" disabled={!user.data || !name.trim() || !cronExpression.trim() || (sourceMode === "text" ? !content.trim() : !repository.trim() || !sourcePath.trim() || !branch.trim()) || create.isPending} onClick={() => create.mutate()}>
            {create.isPending ? "Saving…" : "Create schedule"}
          </Button>
          {create.isError && <p className="text-sm text-danger">{create.error.message}</p>}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-ink">Your schedules</h2><LinkButton href={href("jobs")} variant="secondary">View audit results</LinkButton></div>
        {Object.entries(deletions).map(([id, initialStatus]) => <ScheduleDeletionStatus key={id} id={id} initialStatus={initialStatus} />)}
        {(user.isPending || user.data && schedules.isPending) && <p className="text-sm text-ink-muted">Loading schedules…</p>}
        {!user.isPending && !user.data && <p className="text-sm text-ink-muted">Use Sign in in the header to manage your schedules.</p>}
        {schedules.isError && (
          <div className="rounded-[10px] border border-line p-4">
            <p className="text-sm text-danger">{schedules.error.message}</p>
            <p className="mt-2 text-sm text-ink-muted">Use Sign in in the header to manage your schedules.</p>
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
                {schedule.scope?.kind === "repo_ref" && typeof schedule.scope.ref === "string" && <p className="mt-1 break-all font-mono text-xs text-ink-muted">{schedule.scope.ref}</p>}
                <SourceMetadata sourceRevision={schedule.sourceRevision} sourceObservedAt={schedule.sourceObservedAt} inputAvailable={schedule.retention?.inputAvailable} verified={schedule.scope?.kind === "repo_ref"} />
                {schedule.lastError && <p className="mt-1 text-xs text-danger">{schedule.lastError}</p>}
              </div>
              {user.data && <ScheduleRetentionControls schedule={schedule} accountId={user.data.id} onDeletion={(id, status) => setDeletions(current => ({ ...current, [id]: status }))} />}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
