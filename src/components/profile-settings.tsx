"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ensureCsrfCookie, type ApiUser } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { Button, FieldLabel, TextInput } from "./ui";

export function ProfileSettings({ user }: { user: ApiUser }) {
  const client = useQueryClient();
  const [name, setName] = useState(user.displayName);
  const save = useMutation({
    mutationFn: async (value: string) => {
      await ensureCsrfCookie();
      return apiFetch<ApiUser>("/api/account/profile", { method: "PATCH", body: JSON.stringify({ accountId: user.id, name: value }) });
    },
    onSuccess: (updated) => client.setQueryData(currentUserOptions.queryKey, updated),
  });
  const unchanged = name.trim() === user.displayName;

  return (
    <section className="rounded-[10px] border border-line bg-canvas-elevated p-5">
      <h2 className="text-lg font-semibold text-ink">Your profile</h2>
      <form className="mt-5 max-w-md space-y-4" onSubmit={(event) => { event.preventDefault(); save.mutate(name.trim()); }}>
        <fieldset disabled={save.isPending} className="space-y-4">
          <label className="block space-y-1"><FieldLabel>Full name</FieldLabel>
            <TextInput name="name" autoComplete="name" required maxLength={100} value={name} onChange={(event) => { setName(event.target.value); save.reset(); }} />
          </label>
          <div className="space-y-1"><FieldLabel>Email</FieldLabel><p className="break-all text-sm text-ink">{user.email ?? "No email on this account"}</p></div>
          <Button type="submit" disabled={unchanged || !name.trim()}>{save.isPending ? "Saving…" : "Save changes"}</Button>
        </fieldset>
      </form>
      <div aria-live="polite" className="mt-3 min-h-6 text-sm text-ink-muted">
        {save.isError ? <span role="alert" className="text-danger">Could not save your name. {save.error.message}</span> : save.isSuccess ? "Profile saved." : null}
      </div>
      <p className="mt-2 text-sm text-ink-muted">SkaleAgents has no passwords. You sign in with a passkey, Google, GitHub, or an email link.</p>
    </section>
  );
}
