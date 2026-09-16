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
  googleSignInHref,
  type ApiToken,
  type ApiTokenCreated,
  type ApiUser,
  type SubscriptionEntitlements,
} from "@/lib/api";
import { GoogleSignInLabel } from "@/components/google-mark";
import { McpConnectionGuide } from "@/components/mcp-connection-guide";
import { Button, FieldLabel, TextInput } from "@/components/ui";

const schema = z.object({
  name: z.string().min(1, "Name required").max(255, "Name is too long"),
});

const MCP_API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082"
).replace(/\/$/, "");

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
    queryKey: ["api-tokens", userQuery.data?.id ?? "guest"],
    enabled: Boolean(userQuery.data),
    queryFn: async () => {
      const data = await apiFetch<{ tokens: ApiToken[] }>("/api/tokens");
      return data.tokens;
    },
  });

  const entitlementsQuery = useQuery({
    queryKey: ["account-entitlements", userQuery.data?.id ?? "guest"],
    enabled: Boolean(userQuery.data),
    queryFn: () => apiFetch<SubscriptionEntitlements>("/api/account/entitlements"),
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
      void queryClient.invalidateQueries({
        queryKey: ["api-tokens", userQuery.data?.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["account-entitlements", userQuery.data?.id],
      });
      form.reset({ name: "Cursor MCP" });
      toast.success("API token created. Copy it now");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      await ensureCsrfCookie();
      return apiFetch<{ ok: true }>(`/api/tokens/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["api-tokens", userQuery.data?.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["account-entitlements", userQuery.data?.id],
      });
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
      toast.error("Could not copy. Select the token manually");
    }
  }

  if (userQuery.isPending) {
    return <p className="text-sm text-ink-muted">Loading…</p>;
  }

  if (!userQuery.data) {
    return (
      <main className="space-y-4">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Connect MCP
        </h1>
        <p className="text-sm text-ink-muted">
          Sign in to connect Cursor, Claude Code, or another AI client to the
          SkaleAgents MCP server.
        </p>
        <Link href={googleSignInHref()} className="text-sm text-accent underline">
          <GoogleSignInLabel>Sign in</GoogleSignInLabel>
        </Link>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Connect MCP
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Connect your AI model to your app and infrastructure review workflow.
          The <code className="font-mono text-ink">@skaleagents/swarm</code>{" "}
          server runs locally in your AI client. Tokens stay valid after you
          sign out of the web app until you revoke them here.
        </p>
      </div>

      {entitlementsQuery.data && (
        <section className="max-w-2xl rounded-[10px] border border-line bg-canvas-elevated p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-wide text-accent">Plan</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">{entitlementsQuery.data.planLabel}</h2>
            </div>
            <p className="text-sm text-ink-muted">
              {entitlementsQuery.data.mcpSeats.used} of {entitlementsQuery.data.mcpSeats.limit} MCP seats used
            </p>
          </div>
          {entitlementsQuery.data.upgrade.required ? (
            <div className="mt-3 space-y-1 text-sm text-danger">
              <p>{entitlementsQuery.data.upgrade.message}</p>
              <Link href={entitlementsQuery.data.upgrade.path} className="underline">Review plan settings</Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">
              {entitlementsQuery.data.mcpSeats.available} MCP seat{entitlementsQuery.data.mcpSeats.available === 1 ? "" : "s"} available.
            </p>
          )}
        </section>
      )}

      <McpConnectionGuide token={revealedToken} apiUrl={MCP_API_URL} />

      {revealedToken && (
        <section className="max-w-2xl space-y-3 rounded-[10px] border border-accent/40 bg-accent-soft p-4">
          <h2 className="text-sm font-semibold text-ink">New token, copy now</h2>
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
