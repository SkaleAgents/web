"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { apiFetch, ensureCsrfCookie, type SwarmJob } from "@/lib/api";
import { auditFileBasename, auditFileError, joinAuditFiles, type AuditFilePart } from "@/lib/audit-files";
import { Button, LinkButton } from "@/components/ui";
import { currentUserOptions } from "@/lib/session";
import { SourceMetadataFields } from "@/components/source-metadata-fields";
import { buildSourceMetadata } from "@/lib/source-metadata";
import { personalDestinationFromPath } from "@/lib/dashboard-routes";
import { PUBLIC_DATABASE_SAMPLE, changePhrase, exactLineEdit } from "@/lib/review-edits";

const sampleEdit = exactLineEdit(PUBLIC_DATABASE_SAMPLE, "Database publicly accessible");
const sampleExpectation = sampleEdit ? changePhrase(sampleEdit) : null;

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
  const [files, setFiles] = useState<AuditFilePart[]>([]);
  const [fileError, setFileError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const submission = files.length > 0 ? joinAuditFiles(files) : content;
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
          scope: { kind: "iac_text", format: "auto", content: submission },
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
      <p className="mt-2 text-sm text-ink-muted">Add SkaleAgents in your editor, then ask it to scan Terraform, CloudFormation, Kubernetes, Pulumi YAML, a Pulumi program, or Docker Compose in the open project. For the rest of the codebase, ask it to review application source for a disabled timeout, a one-connection pool, an unbounded retry limit, an unlimited database pool, or a root container user. The same scan reports a public database, wildcard permissions, the Docker socket, and a missing memory limit. This does not connect to a live cloud account.</p>
      <LinkButton href={mcpPath} className="mt-4">Set up MCP</LinkButton>
    </section>
      <form className="overflow-hidden rounded-xl border border-line bg-canvas-elevated" onSubmit={(event) => { event.preventDefault(); if (user.data && submission.trim() && !fileError && specialists.length && !create.isPending) create.mutate(); }}>
      <fieldset disabled={create.isPending} className="min-w-0">
      <section className="p-5 sm:p-6" aria-labelledby="configuration-heading">
        <h2 id="configuration-heading" className="text-base font-semibold text-ink">1. Configuration</h2>
        <p className="mt-2 text-sm text-ink-muted">Paste your Terraform, CloudFormation, Kubernetes, or Pulumi YAML file, or a Dockerfile or GitHub Actions workflow. A review can notice a container that runs as root, a workflow that checks out pull request code from pull_request_target, and an action pinned to @main. Include the resources a reviewer needs to understand the scope.</p>
        <p className="mt-2 text-sm text-ink-muted">Several text files can be added and each file is scanned on its own, while the paste box remains for a single snippet.</p>
        <input
          ref={fileInput}
          type="file"
          multiple
          className="mt-3 block w-full text-sm text-ink file:mr-3 file:rounded-[10px] file:border file:border-line file:bg-canvas file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
          aria-label="Audit text files"
          onChange={(event) => {
            const selected = [...(event.target.files ?? [])];
            void Promise.all(selected.map(async (file) => ({ name: file.name, text: await file.text() }))).then((loaded) => {
              const error = auditFileError(loaded);
              setFileError(error ?? "");
              setFiles(error || loaded.length === 0 ? [] : loaded);
            });
          }}
        />
        {files.length > 0 && <p className="mt-2 text-xs text-ink-muted">{files.map((file) => auditFileBasename(file.name)).join(", ")}</p>}
        {files.length > 0 && <Button type="button" variant="ghost" className="mt-2" onClick={() => { setFiles([]); setFileError(""); if (fileInput.current) fileInput.current.value = ""; }}>Remove selected files</Button>}
        {fileError && <p role="alert" className="mt-2 text-sm text-danger">{fileError}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={() => setContent(PUBLIC_DATABASE_SAMPLE)}>Try a sample</Button>
          <div className="text-sm text-ink-muted">
            <p>This sample should report a database that is publicly accessible.</p>
            {sampleExpectation && <p className="mt-1"><span className="font-semibold text-ink">Database publicly accessible</span> {sampleExpectation}</p>}
          </div>
        </div>
        <textarea
          aria-hidden="true"
          readOnly
          tabIndex={-1}
          className="sr-only"
          aria-label="Audit submission content"
          value={submission}
        />
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
          <Button type="submit" disabled={!user.data || !submission.trim() || Boolean(fileError) || specialists.length === 0 || create.isPending}>
            {create.isPending ? "Starting audit…" : "Start audit"}
          </Button>
          {!submission.trim() && <span className="text-sm text-ink-muted">Add configuration to start.</span>}
        </div>
        {create.isError && <p role="alert" className="mt-3 text-sm text-danger">{create.error.message}</p>}
      </section>
      </fieldset>
      </form>
  </main>;
}
