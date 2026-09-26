export type SourceMetadata = {
  sourceRevision: string;
  sourceObservedAt: string;
};

export function buildSourceMetadata(revision: string, observedAt: string): Partial<SourceMetadata> {
  const sourceRevision = revision.trim();
  if (!sourceRevision && !observedAt) return {};
  if (!sourceRevision || !observedAt) {
    throw new Error("Enter both a source revision and observation time, or leave both blank");
  }
  if (sourceRevision.length > 255) throw new Error("Source revision must be 255 characters or fewer");

  const date = new Date(observedAt);
  if (Number.isNaN(date.getTime())) throw new Error("Enter a valid source observation time");

  // The source-metadata API accepts timestamps at whole-second precision.
  return { sourceRevision, sourceObservedAt: date.toISOString().replace(/\.\d{3}Z$/, "Z") };
}
