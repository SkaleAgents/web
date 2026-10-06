import { priorityReview } from "@/lib/audit-risk";
import { SUBMITTED_TEXT_UNAVAILABLE, proposedDownloadLine } from "@/lib/review-edits";

export type ComplianceFinding = {
  severity?: string;
  title?: string;
  detail?: string;
  resource?: string;
  remediation?: string;
  specialist?: string;
};

export type ReportSource = { content: string | null };

export type ComplianceControl = {
  theme?: string;
  findingCount?: number;
  limitation?: string | null;
  findings?: ComplianceFinding[];
};

export type ComplianceReport = {
  generatedAt?: string;
  job?: {
    id?: string;
    status?: string;
    summary?: string | null;
    error?: string | null;
    partial?: boolean;
    partialMeaning?: string;
    dispatchActor?: "user" | "scheduler";
  };
  controls?: ComplianceControl[];
  unmappedFindings?: ComplianceFinding[];
};

const zeroThemeLimitation = "No finding in this theme does not prove the control passed. Only the checks that ran against the submitted text are represented.";
const partialMeaningWhenFalse = "No selected specialist task was skipped. This is not proof of complete coverage.";
const partialMeaningWhenTrue = "Some checks may be missing. This is not the full picture.";
const fixTheseFirstHeading = "Fix these first";

function partialMeaningText(report: ComplianceReport): string | undefined {
  const explicit = report.job?.partialMeaning?.trim();
  if (explicit) return explicit;
  if (report.job?.partial === true) return partialMeaningWhenTrue;
  if (report.job?.partial === false) return partialMeaningWhenFalse;
  return undefined;
}

function zeroThemeText(control: ComplianceControl): string | undefined {
  const count = control.findingCount ?? control.findings?.length ?? 0;
  if (count > 0) return undefined;
  const explicit = control.limitation?.trim();
  return explicit || zeroThemeLimitation;
}

type HandoffEntry = {
  title: string;
  severity: string;
  proposedChange?: string;
  recommendedAction?: string;
};

type HandoffSection = {
  heading: string;
  submittedText?: string;
  findings: HandoffEntry[];
};

function collectedFindings(report: ComplianceReport): ComplianceFinding[] {
  const seen = new Set<string>();
  const findings: ComplianceFinding[] = [];
  const groups = [
    ...(report.controls ?? []).map((control) => control.findings ?? []),
    report.unmappedFindings ?? [],
  ];
  for (const group of groups) {
    for (const finding of group) {
      const key = [finding.title, finding.severity, finding.detail, finding.remediation, finding.resource].join("\0");
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push(finding);
    }
  }
  return findings;
}

function handoffSection(report: ComplianceReport, content: string | null): HandoffSection {
  const ranked = collectedFindings(report).map((finding) => ({
    title: finding.title ?? "",
    severity: finding.severity ?? "",
    remediation: finding.remediation,
  }));
  const section: HandoffSection = {
    heading: fixTheseFirstHeading,
    findings: priorityReview(ranked).priority.map((finding) => {
      const entry: HandoffEntry = { title: finding.title, severity: finding.severity };
      const proposed = proposedDownloadLine(content, finding.title);
      if (proposed) entry.proposedChange = proposed;
      const action = finding.remediation?.trim();
      if (action) entry.recommendedAction = action;
      return entry;
    }),
  };
  if (content === null) section.submittedText = SUBMITTED_TEXT_UNAVAILABLE;
  return section;
}

function withHandoff(report: ComplianceReport, source?: ReportSource): ComplianceReport & { fixTheseFirst?: HandoffSection } {
  if (!source) return report;
  return { ...report, fixTheseFirst: handoffSection(report, source.content) };
}

export function reportToJson(report: unknown, source?: ReportSource): string {
  if (!source || !report || typeof report !== "object" || Array.isArray(report)) {
    return `${JSON.stringify(report, null, 2)}\n`;
  }
  return `${JSON.stringify(withHandoff(report as ComplianceReport, source), null, 2)}\n`;
}

function csvCell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  if (/[",\n\r]/.test(safe)) return `"${safe.replaceAll('"', '""')}"`;
  return safe;
}

function findingRow(theme: string, count: string, finding: ComplianceFinding, note: string): string {
  return [
    theme,
    count,
    finding.severity ?? "",
    finding.title ?? "",
    finding.detail ?? "",
    finding.resource ?? "",
    finding.remediation ?? "",
    finding.specialist ?? "",
    note,
  ].map(csvCell).join(",");
}

export function reportToCsv(report: ComplianceReport, source?: ReportSource): string {
  const rows = ["theme,finding_count,severity,title,detail,resource,remediation,specialist,note"];
  const meaning = partialMeaningText(report);
  if (meaning) rows.push(findingRow("partial_meaning", "", {}, meaning));
  for (const control of report.controls ?? []) {
    const findings = control.findings ?? [];
    const theme = control.theme ?? "";
    const limitation = zeroThemeText(control);
    if (findings.length === 0) {
      rows.push(findingRow(theme, String(control.findingCount ?? 0), {}, limitation ?? zeroThemeLimitation));
      continue;
    }
    for (const finding of findings) {
      rows.push(findingRow(theme, String(control.findingCount ?? findings.length), finding, ""));
    }
  }
  for (const finding of report.unmappedFindings ?? []) {
    rows.push(findingRow("unmapped", "1", finding, ""));
  }
  if (source) {
    const section = handoffSection(report, source.content);
    if (section.findings.length > 0) {
      rows.push("");
      rows.push(section.heading);
      if (section.submittedText) rows.push(section.submittedText);
      rows.push("severity,title,proposed_change,recommended_action");
      for (const entry of section.findings) {
        rows.push([entry.severity, entry.title, entry.proposedChange ?? "", entry.recommendedAction ?? ""].map(csvCell).join(","));
      }
    }
  }
  return `${rows.join("\n")}\n`;
}

function pdfEscape(value: string): string {
  const ascii = value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "?");
  return ascii.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function wrap(text: string, width = 88): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const pieces = word.length > width ? word.match(new RegExp(`.{1,${width}}`, "g")) ?? [word] : [word];
    for (const piece of pieces) {
      if (!line) {
        line = piece;
        continue;
      }
      if (line.length + 1 + piece.length > width) {
        lines.push(line);
        line = piece;
      } else {
        line = `${line} ${piece}`;
      }
    }
  }
  if (line) lines.push(line);
  return lines.length > 0 ? lines : [""];
}

function reportLines(report: ComplianceReport, source?: ReportSource): string[] {
  const meaning = partialMeaningText(report);
  const lines = [
    "SkaleAgents compliance report",
    `Generated: ${report.generatedAt ?? "unknown"}`,
    `Audit: ${report.job?.id ?? "unknown"}`,
    `Status: ${report.job?.status ?? "unknown"}`,
    ...(report.job?.dispatchActor === "scheduler" ? ["Queued by: scheduled run"] : report.job?.dispatchActor === "user" ? ["Queued by: direct request"] : []),
    ...(meaning ? [meaning] : []),
    "",
    "Empty themes are not a pass. Only recorded findings are listed.",
    "This file is not a certification.",
    "",
  ];
  if (report.job?.summary) lines.push(...wrap(`Summary: ${report.job.summary}`), "");
  if (report.job?.error) lines.push(...wrap(`Error: ${report.job.error}`), "");
  if (source) {
    const section = handoffSection(report, source.content);
    if (section.findings.length > 0) {
      lines.push(section.heading);
      if (section.submittedText) lines.push(...wrap(section.submittedText));
      for (const entry of section.findings) {
        lines.push(...wrap(`${entry.severity || "unspecified"}: ${entry.title || "Untitled finding"}`));
        if (entry.proposedChange) lines.push(...wrap(entry.proposedChange));
        if (entry.recommendedAction) lines.push(...wrap(`Recommended action: ${entry.recommendedAction}`));
      }
      lines.push("");
    }
  }
  for (const control of report.controls ?? []) {
    const findings = control.findings ?? [];
    lines.push(...wrap(`${control.theme ?? "theme"}: ${findings.length} recorded`));
    if (findings.length === 0) {
      lines.push(...wrap(zeroThemeText(control) ?? zeroThemeLimitation), "");
      continue;
    }
    for (const finding of findings) {
      lines.push(...wrap(`${finding.severity ?? "unspecified"}: ${finding.title ?? "Untitled finding"}`));
      if (finding.detail) lines.push(...wrap(finding.detail));
      if (finding.resource) lines.push(...wrap(`Resource: ${finding.resource}`));
      if (finding.remediation) lines.push(...wrap(`Remediation: ${finding.remediation}`));
      lines.push("");
    }
  }
  for (const finding of report.unmappedFindings ?? []) {
    lines.push(...wrap(`unmapped: ${finding.title ?? "Untitled finding"}`), "");
  }
  return lines;
}

export function reportToPdf(report: ComplianceReport, source?: ReportSource): Uint8Array {
  const pageSize = 42;
  const lines = reportLines(report, source);
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += pageSize) pages.push(lines.slice(index, index + pageSize));
  if (pages.length === 0) pages.push([""]);

  const fontId = 3 + pages.length * 2;
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    `2 0 obj\n<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj\n`,
  ];
  pages.forEach((pageLines, index) => {
    const pageId = 3 + index * 2;
    const contentId = pageId + 1;
    const commands = ["BT", "/F1 11 Tf", "54 750 Td", "14 TL"];
    for (const line of pageLines) commands.push(`(${pdfEscape(line)}) Tj`, "T*");
    commands.push("ET");
    const stream = commands.join("\n");
    objects.push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>\nendobj\n`,
      `${contentId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    );
  });
  objects.push(`${fontId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);

  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(body.length);
    body += object;
  }
  const xrefAt = body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  return new TextEncoder().encode(`${body}${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);
}
