export type CheckResult = {
  ruleId: string;
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
};
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
