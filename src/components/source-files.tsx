import type { SourceFile } from "@/lib/api";
import { SKIP_REASONS } from "@/lib/github";

/** Which files a whole-repository GitHub scan read, and why it left any out. */
export function SourceFiles({ files }: { files: SourceFile[] }) {
  const scanned = files.filter((file) => file.status === "scanned");
  const skipped = files.filter((file) => file.status === "skipped");
  return <section className="audit-source" aria-label="Files reviewed">
    <h2>Files reviewed</h2>
    <p className="mt-1 text-sm text-ink-muted">{scanned.length} scanned, {skipped.length} skipped.</p>
    {scanned.length > 0 && <ul className="mt-2 max-h-48 overflow-auto font-mono text-xs text-ink">{scanned.map((file) => <li key={file.path} className="break-all">{file.path}</li>)}</ul>}
    {skipped.length > 0 && <>
      <h3 className="mt-3 text-sm font-medium text-ink">Skipped</h3>
      <ul className="mt-1 max-h-48 overflow-auto text-xs text-ink-muted">{skipped.map((file) => <li key={file.path} className="break-all"><span className="font-mono">{file.path}</span>: {(file.reason && SKIP_REASONS[file.reason]) || "not read"}</li>)}</ul>
    </>}
  </section>;
}
