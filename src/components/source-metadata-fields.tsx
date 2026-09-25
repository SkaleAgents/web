import { FieldLabel, TextInput } from "@/components/ui";

export function SourceMetadataFields({
  idPrefix,
  revision,
  observedAt,
  onRevisionChange,
  onObservedAtChange,
}: {
  idPrefix: string;
  revision: string;
  observedAt: string;
  onRevisionChange: (value: string) => void;
  onObservedAtChange: (value: string) => void;
}) {
  return (
    <fieldset className="mt-4 rounded-lg border border-line p-4">
      <legend className="px-1 text-sm font-medium text-ink">Source metadata (optional)</legend>
      <p className="mb-3 text-xs text-ink-muted">
        Caller-asserted values for this snapshot. The app does not fetch or verify the source, and does not judge freshness by age.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label htmlFor={`${idPrefix}-revision`}>
          <FieldLabel>Source revision</FieldLabel>
          <TextInput id={`${idPrefix}-revision`} value={revision} maxLength={255} onChange={(event) => onRevisionChange(event.target.value)} className="mt-1" placeholder="Commit, version, or caller identifier" />
        </label>
        <label htmlFor={`${idPrefix}-observed-at`}>
          <FieldLabel>Source observed at</FieldLabel>
          <TextInput id={`${idPrefix}-observed-at`} type="datetime-local" step={1} value={observedAt} onChange={(event) => onObservedAtChange(event.target.value)} className="mt-1" />
        </label>
      </div>
      <p className="mt-2 text-xs text-ink-muted">Provide both fields together. Time uses your browser timezone and is submitted as UTC. Do not enter credentials, raw source, or a raw-content hash.</p>
    </fieldset>
  );
}
