export type ComplianceFinding = {
  severity?: string;
  title?: string;
  detail?: string;
  resource?: string;
  remediation?: string;
  specialist?: string;
};

export type ComplianceControl = {
  theme?: string;
  findingCount?: number;
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
    dispatchActor?: "user" | "scheduler";
  };
  controls?: ComplianceControl[];
  unmappedFindings?: ComplianceFinding[];
};

const emptyThemeNote = "No finding recorded. This does not mean the theme passed.";

export function reportToJson(report: unknown): string {
  return `${JSON.stringify(report, null, 2)}\n`;
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

export function reportToCsv(report: ComplianceReport): string {
  const rows = ["theme,finding_count,severity,title,detail,resource,remediation,specialist,note"];
  for (const control of report.controls ?? []) {
    const findings = control.findings ?? [];
    const theme = control.theme ?? "";
    if (findings.length === 0) {
      rows.push(findingRow(theme, String(control.findingCount ?? 0), {}, emptyThemeNote));
      continue;
    }
    for (const finding of findings) {
      rows.push(findingRow(theme, String(control.findingCount ?? findings.length), finding, ""));
    }
  }
  for (const finding of report.unmappedFindings ?? []) {
    rows.push(findingRow("unmapped", "1", finding, ""));
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

function reportLines(report: ComplianceReport): string[] {
  const lines = [
    "SkaleAgents compliance report",
    `Generated: ${report.generatedAt ?? "unknown"}`,
    `Audit: ${report.job?.id ?? "unknown"}`,
    `Status: ${report.job?.status ?? "unknown"}`,
    ...(report.job?.dispatchActor === "scheduler" ? ["Queued by: scheduled run"] : report.job?.dispatchActor === "user" ? ["Queued by: direct request"] : []),
    "",
    "Empty themes are not a pass. Only recorded findings are listed.",
    "This file is not a certification.",
    "",
  ];
  if (report.job?.summary) lines.push(...wrap(`Summary: ${report.job.summary}`), "");
  if (report.job?.error) lines.push(...wrap(`Error: ${report.job.error}`), "");
  for (const control of report.controls ?? []) {
    const findings = control.findings ?? [];
    lines.push(...wrap(`${control.theme ?? "theme"}: ${findings.length} recorded`));
    if (findings.length === 0) {
      lines.push(...wrap(emptyThemeNote), "");
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

export function reportToPdf(report: ComplianceReport): Uint8Array {
  const pageSize = 42;
  const lines = reportLines(report);
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
