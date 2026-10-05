export const AUDIT_FILE_LIMIT = 8;
export const AUDIT_FILE_CHAR_LIMIT = 100_000;
export const AUDIT_CONTENT_CHAR_LIMIT = 500_000;

const markerPrefix = "----- skaleagents-file:";

export type AuditFilePart = {
  name: string;
  text: string;
};

export function auditFileBasename(name: string): string {
  const base = name.trim().split(/[/\\]/).filter((part) => part.length > 0).pop() ?? "";
  return base.trim();
}

export function auditFileMarker(name: string): string {
  return `----- skaleagents-file: ${name} -----`;
}

export function joinAuditFiles(files: AuditFilePart[]): string {
  return files.map((file) => `${auditFileMarker(auditFileBasename(file.name))}\n${file.text}`).join("\n");
}

export function auditFileError(files: AuditFilePart[]): string | undefined {
  if (files.length > AUDIT_FILE_LIMIT) return `Add at most ${AUDIT_FILE_LIMIT} text files.`;
  for (const file of files) {
    const name = auditFileBasename(file.name);
    if (!name) return "Each file needs a file name.";
    if (name.includes(markerPrefix)) return "A file name cannot contain the audit file marker.";
    if (file.text.includes("\0")) return `${name} is not a text file.`;
    if (file.text.length > AUDIT_FILE_CHAR_LIMIT) return `${name} is over 100,000 characters.`;
  }
  if (joinAuditFiles(files).length > AUDIT_CONTENT_CHAR_LIMIT) return "The combined files are over 500,000 characters.";
  return undefined;
}
