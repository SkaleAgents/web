"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch, ensureCsrfCookie, type SwarmJob } from "@/lib/api";
import { Button, LinkButton } from "@/components/ui";
import { currentUserOptions } from "@/lib/session";
import { SourceMetadataFields } from "@/components/source-metadata-fields";
import { buildSourceMetadata } from "@/lib/source-metadata";

const AUDIT_SPECIALISTS = ["devsecops", "sre", "mlops", "scaling"] as const;
const specialistDetails = {
  devsecops: { title: "Security", detail: "Exposed services, broad permissions, and secret handling." },
  sre: { title: "Reliability", detail: "Health checks, failure recovery, and deployment resilience." },
  mlops: { title: "AI workloads", detail: "Model-serving configuration and workload resource concerns." },
  scaling: { title: "Scaling & cost", detail: "Capacity, resource sizing, and scaling configuration." },
};
type AuditSpecialist = (typeof AUDIT_SPECIALISTS)[number];

export default function NewJobPage() {
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
      await ensureCsrfCookie();
      return apiFetch<SwarmJob>("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          scope: { kind: "iac_text", format: "auto", content },
          specialists,
          ...buildSourceMetadata(sourceRevision, sourceObservedAt),
          ...(parsedTelemetry ? { telemetry: parsedTelemetry } : {}),
        }),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["swarm-jobs", user.data?.id ?? "guest"] });
      router.push("/me/jobs");
    },
  });

  return <main className="mx-auto max-w-3xl space-y-6">
    <div className="workspace-intro">
      <LinkButton href="/me/jobs" variant="ghost">Back to audit jobs</LinkButton>
      <h1 className="workspace-heading mt-3">New audit</h1>
      <p className="mt-2 text-sm text-ink-muted">Add configuration, choose what to review, then queue the audit.</p>
    </div>
      <section className="rounded-[10px] border border-line bg-canvas-elevated p-5">
        <h2 className="text-lg font-semibold text-ink">Start an IaC audit</h2>
        <p className="mt-2 text-sm text-ink-muted">Bring Terraform, CloudFormation, or Kubernetes configuration. Include the resources a reviewer needs to understand the scope.</p>
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
        <SourceMetadataFields
          idPrefix="audit-source"
          revision={sourceRevision}
          observedAt={sourceObservedAt}
          onRevisionChange={setSourceRevision}
          onObservedAtChange={setSourceObservedAt}
        />
        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-ink">Specialists</legend>
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
        <div className="mt-3 flex items-center gap-3">
          <Button type="button" disabled={!user.data || !content.trim() || specialists.length === 0 || create.isPending} onClick={() => create.mutate()}>
            {create.isPending ? "Queueing…" : "Queue audit"}
          </Button>
          {create.isError && <p className="text-sm text-danger">{create.error.message}</p>}
        </div>
      </section>

  </main>;
}
