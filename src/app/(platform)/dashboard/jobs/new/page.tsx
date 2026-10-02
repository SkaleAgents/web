"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch, ensureCsrfCookie, type SwarmJob } from "@/lib/api";
import { Button, LinkButton } from "@/components/ui";
import { currentUserOptions } from "@/lib/session";
import { SourceMetadataFields } from "@/components/source-metadata-fields";
import { buildSourceMetadata } from "@/lib/source-metadata";
import { personalDestinationFromPath } from "@/lib/dashboard-routes";

const AUDIT_SPECIALISTS = ["devsecops", "sre", "mlops", "scaling"] as const;
const specialistDetails = {
  devsecops: { title: "Security", detail: "Exposed services, broad permissions, and secret handling." },
  sre: { title: "Reliability", detail: "Health checks, failure recovery, and deployment resilience." },
  mlops: { title: "AI workloads", detail: "Model-serving configuration and workload resource concerns." },
  scaling: { title: "Scaling & cost", detail: "Capacity, resource sizing, and scaling configuration." },
};
type AuditSpecialist = (typeof AUDIT_SPECIALISTS)[number];

export default function NewJobPage() {
  const pathname = usePathname();
  const jobsPath = personalDestinationFromPath(pathname, "jobs");
  const mcpPath = personalDestinationFromPath(pathname, "mcp-config");
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useQuery(currentUserOptions);
  const [content, setContent] = useState("");
  const [telemetry, setTelemetry] = useState("");
  const [sourceRevision, setSourceRevision] = useState("");
  const [sourceObservedAt, setSourceObservedAt] = useState("");
  const [specialists, setSpecialists] = useState<AuditSpecialist[]>(["devsecops", "sre"]);
  const create = useMutation({
    mutationFn: async () => {
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
      const sourceMetadata = buildSourceMetadata(sourceRevision, sourceObservedAt);
      await ensureCsrfCookie();
      return apiFetch<SwarmJob>("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          scope: { kind: "iac_text", format: "auto", content },
          specialists,
          ...sourceMetadata,
          ...(parsedTelemetry ? { telemetry: parsedTelemetry } : {}),
        }),
      });
    },
    onSuccess: (job) => {
      void queryClient.invalidateQueries({ queryKey: ["swarm-jobs", user.data?.id ?? "guest"] });
      router.push(`${jobsPath}/${job.id}`);
    },
  });

  return <main className="mx-auto max-w-3xl space-y-6">
    <div className="workspace-intro">
      <LinkButton href={jobsPath} variant="ghost">Back to audit jobs</LinkButton>
      <h1 className="workspace-heading mt-3">New audit</h1>
      <p className="mt-2 text-sm text-ink-muted">Review the infrastructure files in your codebase, or paste one definition file here.</p>
    </div>
    <section className="rounded-xl border border-line bg-canvas-elevated p-5" aria-labelledby="codebase-heading">
      <h2 id="codebase-heading" className="text-base font-semibold text-ink">Review the codebase</h2>
      <p className="mt-2 text-sm text-ink-muted">Add SkaleAgents in your editor, then ask it to scan the Terraform, CloudFormation, Kubernetes, or Pulumi YAML files in the open project. For the rest of the codebase, ask it to review application source for a disabled timeout, a one-connection pool, or an unbounded retry limit. Pulumi TypeScript, Python, and Go programs are not parsed yet. This does not connect to a live cloud account.</p>
      <LinkButton href={mcpPath} className="mt-4">Set up MCP</LinkButton>
    </section>
      <form className="overflow-hidden rounded-xl border border-line bg-canvas-elevated" onSubmit={(event) => { event.preventDefault(); if (user.data && content.trim() && specialists.length && !create.isPending) create.mutate(); }}>
      <fieldset disabled={create.isPending} className="min-w-0">
      <section className="p-5 sm:p-6" aria-labelledby="configuration-heading">
        <h2 id="configuration-heading" className="text-base font-semibold text-ink">1. Configuration</h2>
        <p className="mt-2 text-sm text-ink-muted">Paste your Terraform, CloudFormation, Kubernetes, or Pulumi YAML file. Include the resources a reviewer needs to understand the scope.</p>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="mt-4 min-h-56 w-full rounded-[10px] border border-line bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent"
          placeholder={'resource "aws_security_group" "web" {}'}
          aria-label="IaC content"
          spellCheck={false}
        />
        <p className="mt-2 text-xs text-ink-muted">Checks review only the input you provide. A result with no findings does not confirm your infrastructure is secure.</p>
      </section>
      <section className="border-t border-line p-5 sm:p-6" aria-labelledby="checks-heading">
        <h2 id="checks-heading" className="text-base font-semibold text-ink">2. Review checks</h2>
        <p className="mt-2 text-sm text-ink-muted">Choose at least one area to review.</p>
        <fieldset className="mt-4">
          <legend className="sr-only">Review areas</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {AUDIT_SPECIALISTS.map((specialist) => (
              <label key={specialist} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm ${specialists.includes(specialist) ? "border-accent bg-accent-soft" : "border-line"}`}>
                <input
                  type="checkbox"
                  checked={specialists.includes(specialist)}
                  onChange={(event) => setSpecialists((current) => event.target.checked
                    ? [...current, specialist]
                    : current.filter((item) => item !== specialist))}
                />
                <span><strong className="block text-ink">{specialistDetails[specialist].title}</strong><span className="mt-1 block text-ink-muted">{specialistDetails[specialist].detail}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>
      <details className="group border-t border-line px-5 py-4 sm:px-6">
        <summary className="cursor-pointer text-sm font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">Advanced options</summary>
        <p className="mt-2 text-sm text-ink-muted">Optionally add telemetry or identify the source revision for this audit.</p>
        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="audit-telemetry">Telemetry JSON (optional)</label>
        <textarea
          id="audit-telemetry"
          value={telemetry}
          onChange={(event) => setTelemetry(event.target.value)}
          className="mt-2 min-h-24 w-full rounded-[10px] border border-line bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent"
          placeholder={'{ "retryCount": 4, "logs": ["request timeout"] }'}
          aria-label="Telemetry JSON"
        />
        <SourceMetadataFields
          idPrefix="audit-source"
          revision={sourceRevision}
          observedAt={sourceObservedAt}
          onRevisionChange={setSourceRevision}
          onObservedAtChange={setSourceObservedAt}
        />
      </details>
      <section className="border-t border-line bg-canvas p-5 sm:p-6" aria-labelledby="start-heading">
        <h2 id="start-heading" className="text-base font-semibold text-ink">3. Start audit</h2>
        <p className="mt-2 text-sm text-ink-muted">{specialists.length === 0 ? "Select at least one review area to continue." : `${specialists.length} review ${specialists.length === 1 ? "area" : "areas"} selected. Your audit will open with its status and results.`}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!user.data || !content.trim() || specialists.length === 0 || create.isPending}>
            {create.isPending ? "Starting audit…" : "Start audit"}
          </Button>
          {!content.trim() && <span className="text-sm text-ink-muted">Add configuration to start.</span>}
        </div>
        {create.isError && <p role="alert" className="mt-3 text-sm text-danger">{create.error.message}</p>}
      </section>
      </fieldset>
      </form>
  </main>;
}
