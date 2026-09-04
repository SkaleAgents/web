"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch, googleSignInHref, type SwarmJob, type WatchtowerSession, watchtowerFetch } from "@/lib/api";
import { Button, LinkButton } from "@/components/ui";

export default function JobsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const jobs = useQuery({
    queryKey: ["swarm-jobs"],
    queryFn: async () => (await apiFetch<{ jobs: SwarmJob[] }>("/api/jobs")).jobs,
  });
  const create = useMutation({
    mutationFn: () => apiFetch<SwarmJob>("/api/jobs", {
      method: "POST",
      body: JSON.stringify({
        scope: { kind: "iac_text", format: "auto", content },
      }),
    }),
    onSuccess: () => {
      setContent("");
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
        <div className="mt-3 flex items-center gap-3">
          <Button type="button" disabled={!content.trim() || create.isPending} onClick={() => create.mutate()}>
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
            <LinkButton href={googleSignInHref()} className="mt-3">Sign in</LinkButton>
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
              <Button type="button" variant="secondary" disabled={openReview.isPending} onClick={() => openReview.mutate(job.id)}>
                Open Watchtower
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
