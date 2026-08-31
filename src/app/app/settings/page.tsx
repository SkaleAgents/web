"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  apiFetch,
  ensureCsrfCookie,
  type ApiToken,
  type ApiTokenCreated,
  type ApiUser,
} from "@/lib/api";
import { Button, FieldLabel, TextInput } from "@/components/ui";

const schema = z.object({
  name: z.string().min(1, "Name required").max(255, "Name is too long"),
});

type FormValues = z.infer<typeof schema>;

function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString();
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [revealedToken, setRevealedToken] = useState<string | null>(null);

  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: async (): Promise<ApiUser | null> => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082";
      const res = await fetch(`${API_URL}/api/user`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(res.statusText);
      return res.json() as Promise<ApiUser>;
    },
  });

  const tokensQuery = useQuery({
    queryKey: ["api-tokens"],
    enabled: Boolean(userQuery.data),
    queryFn: async () => {
      const data = await apiFetch<{ tokens: ApiToken[] }>("/api/tokens");
      return data.tokens;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "Cursor MCP" },
  });

  const create = useMutation({
    mutationFn: async (values: FormValues) => {
      await ensureCsrfCookie();
      return apiFetch<ApiTokenCreated>("/api/tokens", {
        method: "POST",
        body: JSON.stringify(values),
      });
    },
    onSuccess: (data) => {
      setRevealedToken(data.token);
      void queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
      form.reset({ name: "Cursor MCP" });
      toast.success("API token created — copy it now");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      await ensureCsrfCookie();
      return apiFetch<{ ok: true }>(`/api/tokens/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
      toast.success("Token revoked");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  async function copyToken() {
    if (!revealedToken) return;
    try {
      await navigator.clipboard.writeText(revealedToken);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy — select the token manually");
    }
  }

  if (userQuery.isPending) {
    return <p className="text-sm text-ink-muted">Loading…</p>;
  }

  if (!userQuery.data) {
    return (
      <main className="space-y-4">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          API tokens
        </h1>
        <p className="text-sm text-ink-muted">
          Sign in to mint bearer tokens for Cursor, Claude Code, or other MCP
          clients.
        </p>
        <Link href="/app/login" className="text-sm text-accent underline">
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          API tokens
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Create a bearer token for{" "}
          <code className="font-mono text-ink">@skaleagents/swarm</code> in your
          IDE. Tokens stay valid after you sign out of the web app until you
          revoke them here.
        </p>
      </div>

      {revealedToken && (
        <section className="max-w-2xl space-y-3 rounded-[10px] border border-accent/40 bg-accent-soft p-4">
          <h2 className="text-sm font-semibold text-ink">New token — copy now</h2>
          <p className="text-sm text-ink-muted">
            This value is shown once. Store it as{" "}
            <code className="font-mono text-ink">SKALEAGENTS_API_TOKEN</code>.
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-[10px] border border-line bg-canvas-elevated p-3 font-mono text-sm text-ink">
            {revealedToken}
          </pre>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void copyToken()}>
              Copy token
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRevealedToken(null)}
            >
              Dismiss
            </Button>
          </div>
        </section>
      )}

      <form
        className="max-w-xl space-y-3 border-b border-line pb-8"
        onSubmit={form.handleSubmit((values) => create.mutate(values))}
      >
        <h2 className="text-lg font-medium text-ink">Create token</h2>
        <label className="block space-y-1">
          <FieldLabel>Label</FieldLabel>
          <TextInput
            placeholder="Cursor MCP"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <span className="text-sm text-danger">
              {form.formState.errors.name.message}
            </span>
          )}
        </label>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Creating…" : "Create token"}
        </Button>
      </form>

      {tokensQuery.isPending && (
        <p className="text-sm text-ink-muted">Loading tokens…</p>
      )}
      {tokensQuery.isError && (
        <p className="text-sm text-danger">
          {tokensQuery.error instanceof Error
            ? tokensQuery.error.message
            : "Failed to load tokens"}
        </p>
      )}

      {tokensQuery.data && tokensQuery.data.length === 0 && (
        <p className="text-sm text-ink-muted">No tokens yet.</p>
      )}

      {tokensQuery.data && tokensQuery.data.length > 0 && (
        <ul className="divide-y divide-line">
          {tokensQuery.data.map((token) => (
            <li
              key={token.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div>
                <p className="font-medium text-ink">{token.name}</p>
                <p className="text-xs text-ink-muted">
                  Created {formatWhen(token.createdAt)} · Last used{" "}
                  {formatWhen(token.lastUsedAt)}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="px-2 py-1"
                disabled={revoke.isPending}
                onClick={() => revoke.mutate(token.id)}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
