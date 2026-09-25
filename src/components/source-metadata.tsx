export function SourceMetadata({
  sourceRevision,
  sourceObservedAt,
  inputAvailable,
}: {
  sourceRevision?: string | null;
  sourceObservedAt?: string | null;
  inputAvailable?: boolean;
}) {
  if (inputAvailable === false) {
    return <p className="mt-2 text-xs text-ink-muted">Input unavailable. Source metadata is hidden.</p>;
  }

  return (
    <div className="mt-2 space-y-1 text-xs text-ink-muted" aria-label="Caller-asserted source metadata">
      <p>Caller-reported source revision: {sourceRevision ?? "unknown"}</p>
      <p>Caller-reported source observation time: {sourceObservedAt ? new Date(sourceObservedAt).toLocaleString() : "unknown"}</p>
      <p>This records what the caller supplied. The app does not fetch or verify the source, or guarantee freshness.</p>
    </div>
  );
}
