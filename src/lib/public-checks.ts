export type PublicCheck = {
  slug: string;
  ruleId: string;
  area: "Security" | "Reliability" | "AI workloads" | "Scaling and cost";
  title: string;
  looksFor: string;
  needs: string;
  finding: string;
  limit: string;
  exampleLabel: string;
  example: string;
};

export const publicChecks: PublicCheck[] = [
  {
    slug: "public-network-access",
    ruleId: "iac.public-network-access",
    area: "Security",
    title: "Public network access",
    looksFor: "An unrestricted IPv4 range (0.0.0.0/0) or IPv6 range (::/0) used as a source outside an explicit egress rule.",
    needs: "Infrastructure text you paste in, such as Terraform or a Kubernetes manifest. The check reads that text only.",
    finding: "High severity. The suggested next step is to restrict ingress to approved ranges or trusted security groups.",
    limit: "A public range that appears only in a comment is not treated as an ingress rule. This check does not connect to a cloud account, and no finding does not prove the network is private.",
    exampleLabel: "Ingress that this check is written to notice",
    example: `ingress {
  cidr_blocks = ["0.0.0.0/0"]
}`,
  },
  {
    slug: "wildcard-iam-permissions",
    ruleId: "iac.wildcard-iam-action",
    area: "Security",
    title: "Wildcard IAM permissions",
    looksFor: "An unrestricted IAM action pattern in the supplied infrastructure text.",
    needs: "Infrastructure text that includes the permission statement. The check does not read an IAM console or account.",
    finding: "High severity. The suggested next step is to replace the wildcard with the smallest permission set the workload needs.",
    limit: "It cannot tell whether a wildcard is justified by a break-glass process outside the text you supplied.",
    exampleLabel: "Action pattern that this check is written to notice",
    example: `statement {
  actions = ["*"]
}`,
  },
  {
    slug: "elevated-container-privileges",
    ruleId: "iac.elevated-container-privileges",
    area: "Security",
    title: "Elevated container privileges",
    looksFor: "A Kubernetes manifest that enables a privileged execution setting.",
    needs: "The manifest text. The check does not inspect a running cluster.",
    finding: "Critical severity when the setting is present. The suggested next step is to remove it unless the workload needs it and is isolated on purpose.",
    limit: "A privileged setting that is not in the supplied manifest is outside this check.",
    exampleLabel: "Setting that this check is written to notice",
    example: `securityContext:
  privileged: true`,
  },
  {
    slug: "container-image-scan",
    ruleId: "iac.container-image-scan",
    area: "Security",
    title: "Container image scan",
    looksFor: "This check does not scan a container registry. It is listed so a review can say the image was not scanned.",
    needs: "No registry credentials are used. If the text names an image, the check is skipped because a scanner is not configured. If the text names no image, the check does not apply.",
    finding: "It does not produce an image vulnerability finding.",
    limit: "A completed security review can still show this check as skipped. That is expected. It is not a clean image report.",
    exampleLabel: "What a review should say",
    example: "Skipped. This check does not apply to the supplied input, or container image scanning is not configured.",
  },
  {
    slug: "error-rate",
    ruleId: "sre.elevated-error-rate",
    area: "Reliability",
    title: "Error rate",
    looksFor: "A supplied errorRate of 0.05 or higher.",
    needs: "Telemetry you include with the review, as a number on errorRate. There is no live metrics connection.",
    finding: "Medium below 0.2, and high at 0.2 or above. The suggested next step is to inspect failing requests, bound retries, and check alert thresholds.",
    limit: "If errorRate is missing, the check is skipped. It does not invent a rate from logs.",
    exampleLabel: "Telemetry field",
    example: `{ "errorRate": 0.05 }`,
  },
  {
    slug: "failed-scheduled-jobs",
    ruleId: "sre.failed-crons",
    area: "Reliability",
    title: "Failed scheduled jobs",
    looksFor: "A supplied failedCrons count greater than zero.",
    needs: "Telemetry you include, as a number on failedCrons.",
    finding: "Medium severity. The suggested next step is to read the failure logs and add retry or recovery where it belongs.",
    limit: "A count of zero is not a finding. A missing field skips the check.",
    exampleLabel: "Telemetry field",
    example: `{ "failedCrons": 2 }`,
  },
  {
    slug: "retry-and-timeout-patterns",
    ruleId: "sre.retry-pattern",
    area: "Reliability",
    title: "Retry and timeout patterns",
    looksFor: "A retryCount of 3 or more, or at least two log lines that mention a timeout, connection reset, retry exhaustion, retrying, or HTTP 429 or 503.",
    needs: "Telemetry you include: retryCount, a logs array of strings, or both.",
    finding: "Medium by default. High when retryCount is 10 or more, or when five or more of those log lines match. The suggested next step is to cap retries with backoff and check timeouts.",
    limit: "Unrelated log text does not count. Missing telemetry skips the check.",
    exampleLabel: "Telemetry fields",
    example: `{ "retryCount": 3, "logs": ["request timeout", "status 503"] }`,
  },
  {
    slug: "model-token-consumption",
    ruleId: "mlops.high-token-consumption",
    area: "AI workloads",
    title: "Model token consumption",
    looksFor: "A supplied tokenCount or tokens value of 100,000 or more.",
    needs: "Telemetry you include. The check does not call a model provider.",
    finding: "Medium below 1,000,000 tokens, and high at or above that. The suggested next step is to review prompt size, routing, caching, and per-request limits.",
    limit: "It does not decide whether the spend was worth it.",
    exampleLabel: "Telemetry field",
    example: `{ "tokenCount": 100000 }`,
  },
  {
    slug: "ai-api-latency",
    ruleId: "mlops.high-api-latency",
    area: "AI workloads",
    title: "AI API latency",
    looksFor: "A supplied apiLatencyMs or routingLatencyMs of 500 or more.",
    needs: "Telemetry you include, in milliseconds.",
    finding: "Medium below 2,000 ms, and high at or above that. The suggested next step is to inspect routing, timeouts, model choice, and region.",
    limit: "It uses the number you supply. It does not measure the provider itself.",
    exampleLabel: "Telemetry field",
    example: `{ "apiLatencyMs": 500 }`,
  },
  {
    slug: "ai-compute-utilization",
    ruleId: "mlops.high-compute-utilization",
    area: "AI workloads",
    title: "AI compute utilization",
    looksFor: "A supplied computeUtilization, gpuUtilization, or cpuUtilization of 85 percent or more.",
    needs: "Telemetry you include, as a percent.",
    finding: "Medium below 95 percent, and high at or above that. The suggested next step is to review limits, batching, model size, and capacity.",
    limit: "For an AI workload review, cpuUtilization is read as compute utilization. It is not the scaling replica check.",
    exampleLabel: "Telemetry field",
    example: `{ "computeUtilization": 85 }`,
  },
  {
    slug: "autoscaling-capacity",
    ruleId: "scaling.autoscaling-ceiling",
    area: "Scaling and cost",
    title: "Autoscaling capacity",
    looksFor: "cpuUtilization of 80 percent or more while minReplicas is greater than or equal to maxReplicas.",
    needs: "All three numbers in the telemetry you include.",
    finding: "Medium below 95 percent CPU, and high at or above that, when the replica floor already meets the ceiling. The suggested next step is to review the maximum replica limit against demand.",
    limit: "High CPU alone is not this finding. The replica floor has to meet the ceiling as well. A missing number skips the check.",
    exampleLabel: "Telemetry fields",
    example: `{ "cpuUtilization": 80, "minReplicas": 4, "maxReplicas": 4 }`,
  },
  {
    slug: "database-bottlenecks",
    ruleId: "scaling.database-bottleneck",
    area: "Scaling and cost",
    title: "Database bottlenecks",
    looksFor: "dbQueryLatencyMs or databaseQueryLatencyMs of 500 or more, or a slowQueryCount or dbSlowQueries greater than zero.",
    needs: "Whichever of those telemetry fields you can supply.",
    finding: "Medium by default, and high when query latency is 2,000 ms or more. The suggested next step is to inspect plans, indexes, pools, and database capacity before adding application replicas.",
    limit: "It does not open the database or explain a query plan.",
    exampleLabel: "Telemetry fields",
    example: `{ "dbQueryLatencyMs": 500 }`,
  },
];

export const publicCheckAreas = ["Security", "Reliability", "AI workloads", "Scaling and cost"] as const;

export function publicCheckBySlug(slug: string): PublicCheck | undefined {
  return publicChecks.find((check) => check.slug === slug);
}

export function publicCheckPath(check: Pick<PublicCheck, "slug">): string {
  return `/checks/${check.slug}`;
}
