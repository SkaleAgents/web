export function SourceMetadata({
  sourceRevision,
  sourceObservedAt,
  inputAvailable,
  verified = false,
}: {
  sourceRevision?: string | null;
  sourceObservedAt?: string | null;
  inputAvailable?: boolean;
  verified?: boolean;
}) {
  if (inputAvailable === false) {
    return <p className="mt-2 text-xs text-ink-muted">Input unavailable. Source metadata is hidden.</p>;
  }

  return (
    <div className="mt-2 space-y-1 text-xs text-ink-muted" aria-label={verified ? "Fetched source metadata" : "Caller-asserted source metadata"}>
      <p>{verified ? "Fetched commit" : "Caller-reported source revision"}: {sourceRevision ?? (verified ? "not fetched yet" : "unknown")}</p>
      <p>{verified ? "Last fetched" : "Caller-reported source observation time"}: {sourceObservedAt ? new Date(sourceObservedAt).toLocaleString() : "unknown"}</p>
      <p>{verified ? "The branch is checked at each due run. An unchanged commit skips a new audit." : "This records what the caller supplied. The app does not fetch or verify the source, or guarantee freshness."}</p>
    </div>
  );
}
