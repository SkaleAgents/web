"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, FieldLabel, Select, TextInput } from "@/components/ui";
import { apiFetch, ensureCsrfCookie, type HouseRule } from "@/lib/api";
import { ruleSentence } from "@/lib/house-rules";
import { currentUserOptions } from "@/lib/session";

type Kind = HouseRule["kind"];
const blank = { kind: "require_tag" as Kind, resourceType: "", attribute: "", value: "", severity: "medium" as HouseRule["severity"] };

export default function HouseRulesPage() {
  const client = useQueryClient();
  const user = useQuery(currentUserOptions);
  const queryKey = ["house-rules", user.data?.id ?? "guest"];
  const rules = useQuery({ queryKey, enabled: Boolean(user.data), queryFn: () => apiFetch<{ rules: HouseRule[]; limit: number }>("/api/house-rules") });
  const [draft, setDraft] = useState(blank);
  const add = useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie();
      return apiFetch("/api/house-rules", { method: "POST", body: JSON.stringify({ ...draft, value: draft.kind === "forbid_value" ? draft.value : null }) });
    },
    onSuccess: () => { setDraft(blank); void client.invalidateQueries({ queryKey }); toast.success("Rule added"); },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      await ensureCsrfCookie();
      return apiFetch(`/api/house-rules/${id}`, { method: "DELETE" });
    },
    onSuccess: () => void client.invalidateQueries({ queryKey }),
    onError: (error: Error) => toast.error(error.message),
  });
  const set = (key: keyof typeof blank) => (event: { target: { value: string } }) => setDraft((current) => ({ ...current, [key]: event.target.value }));
  const full = rules.data ? rules.data.rules.length >= rules.data.limit : false;

  return (
    <main className="space-y-8">
      <div className="workspace-intro">
        <h1 className="workspace-heading">House rules</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted">
          Your own Terraform rules, checked on every audit you start from now on. Past audits keep the rules they ran with.
        </p>
      </div>

      <form className="audit-changes space-y-3" aria-label="New house rule" onSubmit={(event) => { event.preventDefault(); add.mutate(); }}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block space-y-1"><FieldLabel>Resource type</FieldLabel>
            <TextInput required value={draft.resourceType} onChange={set("resourceType")} placeholder="aws_s3_bucket" pattern="[a-z][a-z0-9_]{1,63}" /></label>
          <label className="block space-y-1"><FieldLabel>Rule</FieldLabel>
            <Select value={draft.kind} onChange={set("kind")}>
              <option value="require_tag">must have the tag</option>
              <option value="require_attribute">must set</option>
              <option value="forbid_value">must not set</option>
            </Select></label>
          <label className="block space-y-1"><FieldLabel>{draft.kind === "require_tag" ? "Tag" : "Attribute"}</FieldLabel>
            <TextInput required value={draft.attribute} onChange={set("attribute")} placeholder={draft.kind === "require_tag" ? "owner" : "versioning.enabled"} /></label>
          {draft.kind === "forbid_value" ? <label className="block space-y-1"><FieldLabel>To</FieldLabel>
            <TextInput required value={draft.value} onChange={set("value")} placeholder="public-read" maxLength={200} /></label> : null}
          <label className="block space-y-1"><FieldLabel>Severity</FieldLabel>
            <Select value={draft.severity} onChange={set("severity")}>
              {["low", "medium", "high", "critical"].map((severity) => <option key={severity} value={severity}>{severity}</option>)}
            </Select></label>
        </div>
        {draft.resourceType && draft.attribute ? <p className="text-sm text-ink-muted">{ruleSentence(draft)}</p> : null}
        {add.isError ? <p role="alert" className="text-sm text-danger">{add.error.message}</p> : null}
        <Button type="submit" disabled={add.isPending || full}>{full ? "Rule limit reached" : add.isPending ? "Adding…" : "Add rule"}</Button>
      </form>

      {rules.isError ? <p role="alert" className="text-sm text-danger">{rules.error.message}</p> : null}
      {rules.data?.rules.length === 0 ? <p className="text-ink-muted">No rules yet.</p> : null}
      <ul className="space-y-2">
        {rules.data?.rules.map((rule) => <li key={rule.id} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3">
          <span><span className="font-mono text-sm">{ruleSentence(rule)}</span> <span className="text-sm text-ink-muted">({rule.severity})</span></span>
          <Button variant="secondary" disabled={remove.isPending} onClick={() => remove.mutate(rule.id)} aria-label={`Delete rule: ${ruleSentence(rule)}`}>Delete</Button>
        </li>)}
      </ul>
    </main>
  );
}
