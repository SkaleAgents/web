"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, apiFetch, ensureCsrfCookie } from "@/lib/api";
import { currentUserOptions, setSessionUser } from "@/lib/session";
import { Button, FieldLabel, TextInput } from "./ui";

export function DeleteAccount({ accountId }: { accountId: string }) {
  const user = useQuery(currentUserOptions);
  const client = useQueryClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const matches = !!user.data?.email && email.trim().toLowerCase() === user.data.email.toLowerCase();

  async function remove() {
    setBusy(true); setError(null);
    try {
      await ensureCsrfCookie();
      await apiFetch("/api/account", { method: "DELETE", body: JSON.stringify({ accountId, email: email.trim() }) });
      await setSessionUser(client, null);
      client.clear();
      toast.success("Your account was deleted.");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Could not delete your account."));
      setBusy(false);
    }
  }

  return <section aria-labelledby="delete-account" className="space-y-4 rounded-[10px] border border-danger/40 bg-canvas-elevated p-5">
    <h2 id="delete-account" className="text-lg font-semibold text-danger">Delete account</h2>
    <p className="text-sm text-ink-muted">This deletes your account, your personal organization, passkeys, MCP connections, bots, and prompts right away. It can&apos;t be undone. Delete your audits and scheduled audits first, and hand over any organization you own.</p>
    <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (matches && !busy) void remove(); }}>
      <label className="block max-w-sm space-y-1"><FieldLabel>Type {user.data?.email ? <strong className="break-all">{user.data.email}</strong> : "your email"} to confirm</FieldLabel>
        <TextInput type="email" autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} /></label>
      <Button type="submit" variant="secondary" className="!border-danger !text-danger" disabled={!matches || busy}>{busy ? "Deleting…" : "Delete my account"}</Button>
    </form>
    {error && <div role="alert" className="space-y-2 text-sm text-danger">
      <p>{error.message}</p>
      {error instanceof ApiError && error.details.length > 0 && <ul className="list-disc space-y-1 pl-5">{error.details.map((item) => <li key={item}>{item}</li>)}</ul>}
    </div>}
  </section>;
}
