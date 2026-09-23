"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ensureCsrfCookie, type ApiUser, type McpConnection } from "@/lib/api";
import { McpConnectionGuide } from "@/components/mcp-connection-guide";
import { Button } from "@/components/ui";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const user = useQuery({
    queryKey: ["user"],
    queryFn: async (): Promise<ApiUser | null> => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082"}/api/user`, { credentials: "include", headers: { Accept: "application/json" } });
      if (response.status === 401) return null;
      if (!response.ok) throw new Error("Could not load your account");
      return response.json();
    },
  });
  const connections = useQuery({
    queryKey: ["mcp-connections", user.data?.id ?? "guest"],
    enabled: Boolean(user.data),
    queryFn: async () => (await apiFetch<{ connections: McpConnection[] }>("/api/oauth/connections")).connections,
    refetchInterval: user.data ? 15_000 : false,
  });
  const disconnect = useMutation({
    mutationFn: async (id: string) => {
      await ensureCsrfCookie();
      return apiFetch(`/api/oauth/connections/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["mcp-connections"] });
      toast.success("Client disconnected");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <main className="space-y-8">
      <div className="workspace-intro">
        <p className="workspace-kicker">MCP / The connection behind your workflow</p>
        <h1 className="workspace-heading">Connect MCP</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted">Bring SkaleAgents tools into Cursor, Claude Code, or another MCP client. Add the configuration, authorize through Google in your browser, and return to your code. Credentials are handled automatically.</p>
      </div>
      <McpConnectionGuide />
      <section aria-labelledby="connections-heading" className="rounded-xl border border-line bg-canvas-elevated p-5">
        <h2 id="connections-heading" className="text-xl font-semibold">Connected clients</h2>
        <p className="mt-2 text-sm text-ink-muted">Connections appear after OAuth authorization. Disconnecting a client removes its access. Web sign-out does not disconnect your editor.</p>
        {user.isPending ? <p className="mt-4 text-sm text-ink-muted">Loading account…</p> : user.isError ? <p className="mt-4 text-sm text-danger">Could not load your account. Refresh to try again.</p> : !user.data ? <p className="mt-4 text-sm text-ink-muted">Use Google sign-in in the header to see your connected clients. You can read and copy the setup above without signing in here.</p> : <>
          {connections.isPending && <p className="mt-4 text-sm text-ink-muted">Loading connections…</p>}
          {connections.isError && <p className="mt-4 text-sm text-danger">{connections.error.message}</p>}
          {connections.data?.length === 0 && <p className="mt-4 text-sm text-ink-muted">No clients connected yet. Request a review from your MCP client and approve the browser request.</p>}
          <ul className="mt-4 divide-y divide-line">{connections.data?.map((connection) => <li key={connection.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div><p className="font-semibold">{connection.clientId === "skaleagents-mcp" ? "SkaleAgents MCP" : connection.clientId}</p><p className="mt-1 text-xs text-ink-muted">Connected {new Date(connection.createdAt).toLocaleDateString()} · Last used {connection.lastUsedAt ? new Date(connection.lastUsedAt).toLocaleString() : "Not yet"}</p></div>
            <Button type="button" variant="secondary" disabled={disconnect.isPending} onClick={() => disconnect.mutate(connection.id)}>Disconnect</Button>
          </li>)}</ul>
        </>}
      </section>
    </main>
  );
}
