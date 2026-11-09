const severityOrder = ["critical", "high", "medium", "low", "info"] as const;

type Rankable = { severity: string; priority?: number };

const severityRank = (severity: string) => {
  const rank = severityOrder.indexOf(severity as typeof severityOrder[number]);
  return rank === -1 ? severityOrder.length : rank;
};

// A source context can move a finding above a more severe one; without one, severity decides.
export function rankFindings<T extends Rankable>(findings: T[]): T[] {
  const score = (finding: T) => finding.priority ?? severityOrder.length - severityRank(finding.severity);
  return findings
    .map((finding, index) => ({ finding, index }))
    .sort((left, right) => score(right.finding) - score(left.finding)
      || severityRank(left.finding.severity) - severityRank(right.finding.severity)
      || left.index - right.index)
    .map((item) => item.finding);
}

export function priorityReview<T extends Rankable>(findings: T[]): { priority: T[]; remaining: T[] } {
  const priority = rankFindings(findings).slice(0, 3);
  const chosen = new Set<T>(priority);
  return { priority, remaining: findings.filter((finding) => !chosen.has(finding)) };
}

export function leadFinding<T extends Rankable>(findings: T[]): T {
  return rankFindings(findings)[0];
}

export function plainRisk(title: string, severity: string): string {
  const name = title.toLowerCase();
  if (name.includes("public network") || name.includes("broad network") || name.includes("network exposure")) return "Anyone on the internet can reach this.";
  if (name.includes("public database") || name.includes("public data")) return "This data can be reached from the internet.";
  if (name.includes("wildcard")) return "This permission can do far more than the workload needs.";
  if (name.includes("privileged") || name.includes("elevated container") || name.includes("host namespace") || name.includes("host filesystem")) return "This container can control the machine it runs on.";
  if (name.includes("secret") || name.includes("credential") || name.includes("private key") || name.includes("access key")) return "A secret is visible in what you reviewed.";
  if (name.includes("unencrypted") || name.includes("http endpoint")) return "This traffic can be read while it travels.";
  if (severity === "critical" || severity === "high") return "This is serious enough to fix before you rely on it.";
  if (severity === "medium") return "This can cause trouble if you leave it.";
  return "This is smaller, and still worth a look.";
}
