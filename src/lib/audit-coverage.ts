export type CheckResult = {
  ruleId: string;
  title?: string;
  status: "evaluated" | "skipped" | "failed";
  completeness: "complete" | "partial" | "none";
  findingCount: number;
  reasonCodes: string[];
};
export type CheckCoverage = { version: "builtin-coverage-v1"; checks: CheckResult[] };
export type CoverageTask = { specialist: string; status: string; hasSkipReason?: boolean; checkCoverage?: CheckCoverage | null };
export type AuditCoverage = {
  basis: "rule_execution" | "specialist_task_status";
  recordingStatus: "available" | "partial" | "unavailable";
  ruleLevelChecksAvailable: boolean;
  limitation: string;
  counts: { evaluated: number; skipped: number; failed: number; partial: number };
  tasksWithoutCoverage: number;
  tasks: CoverageTask[];
};
export const specialistLabels: Record<string, string> = { devsecops: "Security", sre: "Reliability", mlops: "AI operations", scaling: "Scaling" };
export const checkLabels: Record<string, string> = {
  "iac.public-network-access": "Public network access",
  "iac.wildcard-iam-action": "Wildcard IAM permissions",
  "iac.elevated-container-privileges": "Elevated container privileges",
  "iac.container-image-scan": "Container image scan",
  "sre.elevated-error-rate": "Error rate",
  "sre.failed-crons": "Failed scheduled jobs",
  "sre.retry-pattern": "Retry and timeout patterns",
  "mlops.high-token-consumption": "Model token consumption",
  "mlops.high-api-latency": "AI API latency",
  "mlops.high-compute-utilization": "AI compute utilization",
  "scaling.autoscaling-ceiling": "Autoscaling capacity",
  "scaling.database-bottleneck": "Database bottlenecks",
  SEC001: "Hardcoded credential-like value",
  SEC002: "Possible AWS access key",
  SEC003: "Private key material in source",
  NET002: "Unencrypted HTTP endpoint",
  DATA001: "Public data access",
  DATA002: "Storage encryption disabled",
  DB001: "Public database",
  DB002: "Database backups disabled",
  VM001: "Instance metadata tokens not required",
  K8S002: "Host namespace access",
  K8S003: "Host filesystem mounted",
  K8S004: "Non-root execution not enforced",
  K8S005: "Writable container root filesystem",
  K8S006: "Dangerous Linux capabilities",
  K8S007: "Unpinned container image",
  K8S008: "Missing memory limit",
  K8S012: "Secret stored in manifest",
  K8S013: "Wildcard Kubernetes RBAC",
  NET001: "Broad network exposure",
  IAM001: "Wildcard permission detected",
  K8S001: "Elevated container privileges",
  DATA003: "Object versioning not enabled",
  DB003: "Database deletion protection disabled",
  DB004: "Database lacks multi-zone failover",
  COST001: "Compute sizing needs review",
  K8S009: "Readiness probe missing",
  K8S010: "Liveness probe missing",
  K8S011: "Single workload replica",
  TF001: "Secret assigned in a Terraform variable",
  TF002: "Secret assigned in a Terraform local",
  SLS001: "Secret assigned in serverless environment",
};

export function checkTitle(check: Pick<CheckResult, "ruleId" | "title">): string {
  const provided = check.title?.trim();
  if (provided) return provided;
  return checkLabels[check.ruleId] ?? "";
}

export function evaluatedClearChecks(coverage?: AuditCoverage, tasks: CoverageTask[] = []): Array<{ id: string; title: string }> {
  const rows = coverage?.tasks?.length ? coverage.tasks : tasks;
  const checks: Array<{ id: string; title: string }> = [];
  for (const task of rows) {
    for (const check of task.checkCoverage?.checks ?? []) {
      if (check.status !== "evaluated" || check.findingCount !== 0) continue;
      const title = checkTitle(check);
      if (!title) continue;
      checks.push({ id: `${task.specialist}:${check.ruleId}`, title });
    }
  }
  return checks;
}

export function findingPlace(finding: { resource?: string | null; location?: { path?: string; line?: number } | null }): string | null {
  const path = finding.location?.path;
  const line = finding.location?.line;
  if (path && Number.isInteger(line)) {
    const place = `${path} line ${line}`;
    return finding.resource && finding.resource !== path ? `${finding.resource} · ${place}` : place;
  }
  return finding.resource || null;
}

export function skippedChecks(coverage?: AuditCoverage, tasks: CoverageTask[] = []): Array<{ id: string; label: string; reason: string }> {
  const rows = coverage?.tasks?.length ? coverage.tasks : tasks;
  return rows.flatMap((task) => (task.checkCoverage?.checks ?? []).filter((check) => check.status === "skipped").map((check) => ({
    id: `${task.specialist}:${check.ruleId}`,
    label: checkTitle(check) || "Skipped check",
    reason: check.reasonCodes.map((code) => reasonLabels[code] ?? "Check details unavailable").join(" "),
  })));
}
export const reasonLabels: Record<string, string> = {
  missing_input: "Required input was not supplied.", invalid_input: "Some supplied input could not be evaluated.",
  not_applicable: "This check does not apply to the supplied input.", unsupported_structure: "The input structure is not supported.",
  parse_failed: "The input could not be parsed.", static_literals_only: "Only static values could be evaluated.",
  analysis_depth_limit: "The input exceeded the supported analysis depth.", cyclic_alias: "Cyclic references prevented a complete review.",
  scanner_unavailable: "Container image scanning is not configured.", execution_failed: "The check could not finish.",
};
export function checkLabel(check: CheckResult): string {
  if (check.status === "skipped") return "Skipped";
  if (check.status === "failed") return "Failed";
  if (check.completeness === "partial") return "Evaluated, partial coverage";
  return check.findingCount === 0 ? "Evaluated, no findings" : "Evaluated, findings reported";
}
