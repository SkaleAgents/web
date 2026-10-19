"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, apiFetch, ensureCsrfCookie } from "@/lib/api";
import { Button, FieldLabel, TextInput } from "./ui";

export function DeleteOrganization({ organization }: { organization: { id: string; name: string } }) {
  const client = useQueryClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const matches = name.trim() === organization.name;

  async function remove() {
    setBusy(true); setError(null);
    try {
      await ensureCsrfCookie();
      await apiFetch(`/api/workspaces/${organization.id}`, { method: "DELETE", body: JSON.stringify({ name: name.trim() }) });
      await client.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success(`${organization.name} was deleted.`);
      router.push("/me");
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Could not delete this organization."));
      setBusy(false);
    }
  }

  return <section aria-labelledby="delete-organization" className="space-y-4 rounded-lg border border-danger/40 bg-canvas-elevated p-5">
    <h2 id="delete-organization" className="font-semibold text-danger">Delete organization</h2>
    <p className="text-sm text-ink-muted">This removes the organization, its members, and its invitations right away. It can&apos;t be undone. Delete its audits and scheduled audits, and cancel any paid plan, first.</p>
    <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (matches && !busy) void remove(); }}>
      <label className="block max-w-sm space-y-1"><FieldLabel>Type <strong className="break-all">{organization.name}</strong> to confirm</FieldLabel>
        <TextInput autoComplete="off" value={name} onChange={(event) => setName(event.target.value)} disabled={busy} /></label>
      <Button type="submit" variant="secondary" className="!border-danger !text-danger" disabled={!matches || busy}>{busy ? "Deleting…" : "Delete organization"}</Button>
    </form>
    {error && <div role="alert" className="space-y-2 text-sm text-danger">
      <p>{error.message}</p>
      {error instanceof ApiError && error.details.length > 0 && <ul className="list-disc space-y-1 pl-5">{error.details.map((item) => <li key={item}>{item}</li>)}</ul>}
    </div>}
  </section>;
}
