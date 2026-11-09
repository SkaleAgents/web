"use client";

import { useState } from "react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { Button, FieldLabel, Select } from "@/components/ui";
import { apiFetch, ensureCsrfCookie, type SourceContext } from "@/lib/api";

const fields: Array<{ key: keyof SourceContext; label: string }> = [
  { key: "production", label: "Runs in production?" },
  { key: "internetFacing", label: "Reachable from the internet?" },
  { key: "sensitiveData", label: "Holds sensitive data?" },
];
const toValue = (value: boolean | null) => (value === null ? "" : String(value));

export function SourceContextForm({ jobId, context, queryKey }: { jobId: string; context: SourceContext | null; queryKey: QueryKey }) {
  const client = useQueryClient();
  const [values, setValues] = useState<SourceContext>(context ?? { production: null, internetFacing: null, sensitiveData: null });
  const save = useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie();
      return apiFetch(`/api/jobs/${jobId}/source-context`, { method: "PUT", body: JSON.stringify(values) });
    },
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
  return <form className="audit-changes space-y-3" aria-label="About this source" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
    <p><strong>About this source</strong> <span className="text-ink-muted">Reorders findings for this and later audits. Severity does not change.</span></p>
    <div className="grid gap-3 sm:grid-cols-3">
      {fields.map(({ key, label }) => <label key={key} className="block space-y-1"><FieldLabel>{label}</FieldLabel>
        <Select value={toValue(values[key])} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value === "" ? null : event.target.value === "true" }))}>
          <option value="">Not sure</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </Select>
      </label>)}
    </div>
    {save.isError ? <p role="alert" className="text-sm text-danger">{save.error.message}</p> : null}
    <Button type="submit" variant="secondary" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
  </form>;
}
