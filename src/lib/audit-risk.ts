const severityOrder = ["critical", "high", "medium", "low", "info"] as const;

export function rankFindings<T extends { severity: string }>(findings: T[]): T[] {
  return findings
    .map((finding, index) => ({ finding, index }))
    .sort((left, right) => {
      const leftRank = severityOrder.indexOf(left.finding.severity as typeof severityOrder[number]);
      const rightRank = severityOrder.indexOf(right.finding.severity as typeof severityOrder[number]);
      return (leftRank === -1 ? severityOrder.length : leftRank) - (rightRank === -1 ? severityOrder.length : rightRank) || left.index - right.index;
    })
    .map((item) => item.finding);
}

export function priorityReview<T extends { severity: string }>(findings: T[]): { priority: T[]; remaining: T[] } {
  const priority = rankFindings(findings).slice(0, 3);
  const chosen = new Set<T>(priority);
  return { priority, remaining: findings.filter((finding) => !chosen.has(finding)) };
}

export function leadFinding<T extends { severity: string }>(findings: T[]): T {
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
