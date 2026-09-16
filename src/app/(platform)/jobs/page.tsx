"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch, googleSignInHref, type SwarmJob, type WatchtowerSession, watchtowerFetch } from "@/lib/api";
import { GoogleSignInLabel } from "@/components/google-mark";
import { AdvisoryBookingRequest } from "@/components/advisory-booking-request";
import { Button, LinkButton } from "@/components/ui";

const AUDIT_SPECIALISTS = ["devsecops", "sre", "mlops", "scaling"] as const;
type AuditSpecialist = (typeof AUDIT_SPECIALISTS)[number];

export default function JobsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [telemetry, setTelemetry] = useState("");
  const [specialists, setSpecialists] = useState<AuditSpecialist[]>(["devsecops", "sre"]);
  const jobs = useQuery({
    queryKey: ["swarm-jobs"],
    queryFn: async () => (await apiFetch<{ jobs: SwarmJob[] }>("/api/jobs")).jobs,
  });
  const create = useMutation({
    mutationFn: () => {
      let parsedTelemetry: Record<string, unknown> | undefined;
      if (telemetry.trim()) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(telemetry);
        } catch {
          throw new Error("Telemetry must be valid JSON");
        }
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          throw new Error("Telemetry must be a JSON object");
        }
        parsedTelemetry = parsed as Record<string, unknown>;
      }
      return apiFetch<SwarmJob>("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          scope: { kind: "iac_text", format: "auto", content },
          specialists,
          ...(parsedTelemetry ? { telemetry: parsedTelemetry } : {}),
        }),
      });
    },
    onSuccess: () => {
      setContent("");
      setTelemetry("");
      void queryClient.invalidateQueries({ queryKey: ["swarm-jobs"] });
    },
  });
  const openReview = useMutation({
    mutationFn: (jobId: string) => watchtowerFetch<WatchtowerSession>("/sessions", {
      method: "POST",
      body: JSON.stringify({ jobId }),
    }),
    onSuccess: (session) => router.push(`/watchtower/${session.id}`),
  });

  return (
    <main className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Audit jobs</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Run an IaC audit, then open a shared Watchtower review when results arrive.
        </p>
      </div>

      <section className="rounded-[10px] border border-line bg-canvas-elevated p-5">
        <h2 className="text-lg font-semibold text-ink">Start an IaC audit</h2>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="mt-4 min-h-32 w-full rounded-[10px] border border-line bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent"
          placeholder={'resource "aws_security_group" "web" {}'}
          aria-label="IaC content"
        />
        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="audit-telemetry">Telemetry JSON (optional)</label>
        <textarea
          id="audit-telemetry"
          value={telemetry}
          onChange={(event) => setTelemetry(event.target.value)}
          className="mt-2 min-h-24 w-full rounded-[10px] border border-line bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent"
          placeholder={'{ "retryCount": 4, "logs": ["request timeout"] }'}
          aria-label="Telemetry JSON"
        />
        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-ink">Specialists</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {AUDIT_SPECIALISTS.map((specialist) => (
              <label key={specialist} className="inline-flex items-center gap-2 text-sm text-ink-muted">
                <input
                  type="checkbox"
                  checked={specialists.includes(specialist)}
                  onChange={(event) => setSpecialists((current) => event.target.checked
                    ? [...current, specialist]
                    : current.filter((item) => item !== specialist))}
                />
                {specialist}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-3 flex items-center gap-3">
          <Button type="button" disabled={!content.trim() || specialists.length === 0 || create.isPending} onClick={() => create.mutate()}>
            {create.isPending ? "Queueing…" : "Queue audit"}
          </Button>
          {create.isError && <p className="text-sm text-danger">{create.error.message}</p>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Your jobs</h2>
        {jobs.isPending && <p className="text-sm text-ink-muted">Loading jobs…</p>}
        {jobs.isError && (
          <div className="rounded-[10px] border border-line p-4">
            <p className="text-sm text-danger">{jobs.error.message}</p>
            <LinkButton href={googleSignInHref()} className="mt-3">
              <GoogleSignInLabel>Sign in</GoogleSignInLabel>
            </LinkButton>
          </div>
        )}
        {jobs.data?.length === 0 && <p className="text-sm text-ink-muted">No audits yet.</p>}
        <ul className="divide-y divide-line">
          {jobs.data?.map((job) => (
            <li key={job.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">{job.status}</p>
                <p className="mt-1 text-sm text-ink">{job.summary ?? "Waiting for specialist results"}</p>
                <p className="mt-1 text-xs text-ink-muted">{new Date(job.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(job.status === "completed" || job.status === "failed") && (
                  <AdvisoryBookingRequest source={{ type: "audit_job", id: job.id }} />
                )}
                <Button type="button" variant="secondary" disabled={openReview.isPending} onClick={() => openReview.mutate(job.id)}>
                  Open Watchtower
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
