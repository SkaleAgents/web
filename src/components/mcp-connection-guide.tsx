"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui";

export function McpConnectionGuide() {
  const [client, setClient] = useState("Cursor");
  const config = JSON.stringify({ mcpServers: { skaleagents: { command: "npx", args: ["-y", "@skaleagents/swarm@0.3.0"], env: { PLATFORM_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "https://api.skaleagents.com" } } } }, null, 2);
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); }
    catch { toast.error("Could not copy. Select the configuration text manually."); }
  }
  return (
    <section className="space-y-7 rounded-xl border border-accent/40 bg-accent-soft p-5 sm:p-7" aria-labelledby="mcp-setup-heading">
      <div><p className="workspace-kicker">One connection / Your own tools</p><h2 id="mcp-setup-heading" className="text-2xl font-semibold">Set up your editor</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">MCP (Model Context Protocol) lets your assistant call SkaleAgents tools with the code and configuration you provide. The server runs locally. Install Node.js 20 or newer before connecting.</p></div>
      <ol className="grid gap-3 text-sm sm:grid-cols-3">
        <li className="rounded-lg border border-line bg-canvas-elevated p-4"><strong>1. Add the configuration</strong><p className="mt-2 text-ink-muted">Choose your editor below and save its MCP configuration.</p></li>
        <li className="rounded-lg border border-line bg-canvas-elevated p-4"><strong>2. Request a review</strong><p className="mt-2 text-ink-muted">Start the server and ask your assistant to call review_architecture. The first tool call opens browser authorization.</p></li>
        <li className="rounded-lg border border-line bg-canvas-elevated p-4"><strong>3. Authorize in your browser</strong><p className="mt-2 text-ink-muted">Sign in with Google if needed and approve MCP access. Return to your editor; credentials are issued and refreshed automatically.</p></li>
      </ol>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2" aria-label="Choose your MCP client">{["Cursor", "Claude Code", "Other clients"].map((name) => <button type="button" key={name} className="filter-chip" aria-pressed={client === name} onClick={() => setClient(name)}>{name}</button>)}</div>
        <p className="text-sm text-ink-muted">{client === "Cursor" ? <>Save this in <code className="text-ink">.cursor/mcp.json</code> at your project root. Open Cursor Settings, then Tools &amp; MCP, and enable skaleagents.</> : client === "Claude Code" ? <>Save this in <code className="text-ink">.mcp.json</code> at your project root. Start Claude Code and use <code className="text-ink">/mcp</code> to check the server.</> : <>Choose a client with local stdio support. Set its command to <code>npx</code> and use the arguments and environment below.</>}</p>
        <pre className="overflow-x-auto rounded-lg border border-line bg-canvas-elevated p-4 font-mono text-xs leading-relaxed">{config}</pre>
        <Button type="button" variant="secondary" onClick={() => void copy(config)}>Copy MCP config</Button>
      </div>
      <details className="rounded-lg border border-line bg-canvas-elevated p-4"><summary className="cursor-pointer font-semibold">Browser did not open, or need to reconnect?</summary><p className="mt-3 text-sm text-ink-muted">Authorization starts on the first tool call. Open the sign-in URL from your MCP server logs if the browser does not launch. Complete sign-in on the same machine as your MCP client so the browser can return to its local callback.</p><p className="mt-3 text-sm text-ink-muted">If a connection expires or is disconnected, call the tool again to start browser authorization. If the editor timed out while you signed in, retry the tool call.</p><p className="mt-3 text-xs text-ink-muted">The client saves credentials in your user configuration directory and refreshes access automatically. No API keys to create or paste.</p></details>
      <div className="grid gap-4 sm:grid-cols-2"><div><h3 className="font-mono text-sm font-semibold">review_architecture</h3><p className="mt-2 text-sm text-ink-muted">Review application code or infrastructure for security, reliability, and cost concerns.</p></div><div><h3 className="font-mono text-sm font-semibold">scan_iac_stub</h3><p className="mt-2 text-sm text-ink-muted">Count resource patterns in Terraform, CloudFormation, or Kubernetes configuration. Use Audit jobs for a specialist review.</p></div></div>
      <p className="border-t border-line pt-5 text-sm text-ink-muted">Try: “Use SkaleAgents to call review_architecture on this configuration. Explain each finding and show how to validate the fix.”</p>
    </section>
  );
}
