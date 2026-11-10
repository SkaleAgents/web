"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { apiFetch, ensureCsrfCookie, fetchJobPages, type SwarmJob } from "@/lib/api";
import { auditFileBasename, auditFileError, joinAuditFiles, type AuditFilePart } from "@/lib/audit-files";
import { Button, LinkButton } from "@/components/ui";
import { currentUserOptions } from "@/lib/session";
import { SourceMetadataFields } from "@/components/source-metadata-fields";
import { buildSourceMetadata } from "@/lib/source-metadata";
import { personalDestinationFromPath } from "@/lib/dashboard-routes";
import { GithubScanButton } from "@/components/github-scan-button";
import { GithubPanel } from "@/components/github-panel";
import { githubErrorMessage, needsUpgrade } from "@/lib/github";
import { PersonalPlanNote } from "@/components/personal-plan-note";
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useQuery(currentUserOptions);
  const firstAudit = useQuery({
    queryKey: ["swarm-jobs", user.data?.id ?? "guest", "recent"],
    enabled: Boolean(user.data),
    queryFn: ({ signal }) => fetchJobPages<SwarmJob>("/api/jobs", 1, signal),
  });
  const showGuide = firstAudit.data?.jobs.length === 0;
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<AuditFilePart[]>([]);
  const [fileError, setFileError] = useState("");
  const [sampleLoaded, setSampleLoaded] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const submission = files.length > 0 ? joinAuditFiles(files) : content;
  const [githubOpen, setGithubOpen] = useState(false);
  const [githubSelection, setGithubSelection] = useState<string | null>(null);
  const githubRef = githubOpen ? githubSelection : null;
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
      // GitHub references take their revision from the fetch, so the caller cannot report one.
      const sourceMetadata = githubRef ? {} : buildSourceMetadata(sourceRevision, sourceObservedAt);
      await ensureCsrfCookie();
      return apiFetch<SwarmJob>("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          scope: githubRef ? { kind: "repo_ref", format: "auto", ref: githubRef } : { kind: "iac_text", format: "auto", content: submission },
          specialists,
          ...sourceMetadata,
          ...(parsedTelemetry ? { telemetry: parsedTelemetry } : {}),
        }),
      });
    },
    onSuccess: (job) => {
      void queryClient.invalidateQueries({ queryKey: ["swarm-jobs", user.data?.id ?? "guest"] });
      void queryClient.invalidateQueries({ queryKey: ["plan-usage", user.data?.id ?? "guest"] });
      router.push(`${jobsPath}/${job.id}`);
    },
  });

  const canSubmit = Boolean(user.data) && (githubOpen ? Boolean(githubRef) : Boolean(submission.trim()) && !fileError) && specialists.length > 0 && !create.isPending;

  return <main className="max-w-4xl space-y-6">
    <div className="workspace-intro">
      <LinkButton href={jobsPath} variant="ghost" className="gap-1.5"><svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>Back to audit jobs</LinkButton>
      <h1 className="workspace-heading mt-3">New audit</h1>
      <p className="mt-2 text-sm text-ink-muted">Paste or upload an infrastructure file to review.</p>
      {user.data && <div className="mt-3"><PersonalPlanNote kind="audits" /></div>}
    </div>
    {showGuide && <section aria-labelledby="first-audit-heading" className="rounded-xl border border-line bg-canvas-elevated p-5">
      <h2 id="first-audit-heading" className="text-base font-semibold text-ink">Run your first audit</h2>
      <ol className="mt-3 grid gap-3 text-sm text-ink-muted sm:grid-cols-3">
        <li><strong className="block text-ink">1. Add a file</strong>Paste one, upload several, or press Try a sample.</li>
        <li><strong className="block text-ink">2. Pick what to review</strong>Security and Reliability are on by default.</li>
        <li><strong className="block text-ink">3. Start audit</strong>Your results open on their own page, usually within a minute.</li>
      </ol>
    </section>}
    <form className="overflow-hidden rounded-xl border border-line bg-canvas-elevated" onSubmit={(event) => { event.preventDefault(); if (canSubmit) create.mutate(); }}>
      <fieldset disabled={create.isPending} className="min-w-0">
      <section className="p-5 sm:p-6">
        {githubOpen && <GithubPanel onRef={setGithubSelection} onClose={() => setGithubOpen(false)} />}
        <div hidden={githubOpen}>
        <input
          ref={fileInput}
          type="file"
          multiple
          className="sr-only"
          tabIndex={-1}
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
        <textarea
          aria-hidden="true"
          readOnly
          tabIndex={-1}
          className="sr-only"
          aria-label="Audit submission content"
          value={submission}
        />
        {files.length > 0 ? (
          <div className="rounded-[10px] border border-line bg-canvas px-3 py-3 text-sm text-ink">
            <p className="font-medium">{files.length} {files.length === 1 ? "file" : "files"} selected</p>
            <p className="mt-1 break-words font-mono text-xs text-ink-muted">{files.map((file) => auditFileBasename(file.name)).join(", ")}</p>
            <Button type="button" variant="ghost" className="mt-2" onClick={() => { setFiles([]); setFileError(""); if (fileInput.current) fileInput.current.value = ""; }}>Remove selected files</Button>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(event) => { setContent(event.target.value); setSampleLoaded(false); }}
            className="min-h-56 w-full rounded-[10px] border border-line bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent"
            placeholder={'Paste Terraform or a Terraform plan (terraform show -json), CloudFormation, Kubernetes or Pulumi YAML, a Dockerfile, or a GitHub Actions workflow'}
            aria-label="IaC content"
            spellCheck={false}
          />
        )}
        {fileError && <p role="alert" className="mt-2 text-sm text-danger">{fileError}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Button type="button" variant="secondary" onClick={() => fileInput.current?.click()}>Upload files</Button>
          <Button type="button" variant="secondary" onClick={() => { setContent(PUBLIC_DATABASE_SAMPLE); setSampleLoaded(true); }}>Try a sample</Button>
          <GithubScanButton onOpen={() => setGithubOpen(true)} />
        </div>
        {sampleLoaded && <p className="mt-2 text-sm text-ink-muted">This sample should report a database that is publicly accessible. <span className="font-semibold text-ink">Database publicly accessible</span> {sampleExpectation}</p>}
        </div>
      </section>
      <fieldset className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4 sm:px-6">
        <legend className="sr-only">Review areas</legend>
        <span className="mr-1 text-sm text-ink-muted" aria-hidden="true">Review for</span>
        {AUDIT_SPECIALISTS.map((specialist) => (
          <label key={specialist} title={specialistDetails[specialist].detail} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${specialists.includes(specialist) ? "border-accent bg-accent-soft text-ink" : "border-line text-ink-muted"}`}>
            <input
              type="checkbox"
              checked={specialists.includes(specialist)}
              aria-describedby={`audit-area-${specialist}`}
              onChange={(event) => setSpecialists((current) => event.target.checked
                ? [...current, specialist]
                : current.filter((item) => item !== specialist))}
            />
            {specialistDetails[specialist].title}
            <span id={`audit-area-${specialist}`} className="sr-only">{specialistDetails[specialist].detail}</span>
          </label>
        ))}
      </fieldset>
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
      <section className="border-t border-line bg-canvas p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!canSubmit}>
            {create.isPending ? "Starting audit…" : githubOpen ? "Scan this branch" : "Start audit"}
          </Button>
          <span className="text-xs text-ink-muted">{specialists.length === 0 ? "Select at least one review area." : "Reviews only what you provide. No findings does not mean secure."}</span>
        </div>
        {create.isError && <p role="alert" className="mt-3 text-sm text-danger">{githubErrorMessage(create.error)} {needsUpgrade(create.error) && <Link href={personalDestinationFromPath(pathname, "billing")} className="underline">Upgrade</Link>}</p>}
      </section>
      </fieldset>
    </form>
    <p className="text-sm text-ink-muted">Auditing a whole repo? Run it from your editor. <Link href="/mcp-config" className="font-medium text-accent underline">Set up MCP</Link></p>
  </main>;
}
