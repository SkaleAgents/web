"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { ArchitectureReviewBrief } from "@/components/architecture-review-brief";

const serverUrl = "https://skaleagents.com/mcp";
const clients = ["Cursor", "Claude Code", "Claude Desktop", "ChatGPT", "Codex"] as const;
type McpClient = (typeof clients)[number];

export function McpConnectionGuide() {
  const [client, setClient] = useState<McpClient>("Cursor");
  const urlOnly = client === "Claude Desktop" || client === "ChatGPT";
  const config = client === "Claude Code"
    ? `claude mcp add --transport http skaleagents ${serverUrl}`
    : client === "Codex"
      ? `[mcp_servers.skaleagents]\nurl = "${serverUrl}"`
      : urlOnly
        ? serverUrl
        : JSON.stringify({ mcpServers: { skaleagents: { url: serverUrl } } }, null, 2);
  const copyLabel = urlOnly ? "Copy server URL" : client === "Claude Code" ? "Copy command" : client === "Codex" ? "Copy Codex config" : "Copy MCP config";
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); }
    catch { toast.error("Could not copy. Select the setup text manually."); }
  }
  return (
    <section className="space-y-7 rounded-xl border border-accent/40 bg-accent-soft p-5 sm:p-7" aria-labelledby="mcp-setup-heading">
      <div><p className="workspace-kicker">One URL / Connect with OAuth</p><h2 id="mcp-setup-heading" className="text-2xl font-semibold">Choose your MCP client</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">Connect your assistant to the hosted SkaleAgents MCP server. Sign in with Google and approve access through OAuth. No API keys or local server to install.</p></div>
      <ol className="grid gap-3 text-sm sm:grid-cols-3">
        <li className="rounded-lg border border-line bg-canvas-elevated p-4"><strong>1. Add SkaleAgents</strong><p className="mt-2 text-ink-muted">Choose your client below and add the server URL using its setup steps.</p></li>
        <li className="rounded-lg border border-line bg-canvas-elevated p-4"><strong>2. Connect with OAuth</strong><p className="mt-2 text-ink-muted">Connect in your client, sign in with Google if needed, and approve MCP access.</p></li>
        <li className="rounded-lg border border-line bg-canvas-elevated p-4"><strong>3. Review the codebase</strong><p className="mt-2 text-ink-muted">Ask your editor to scan the Terraform, CloudFormation, Kubernetes, or Pulumi YAML files in the open project with scan_iac. Pulumi TypeScript, Python, and Go programs are not parsed yet. You can also paste one file into a web audit.</p></li>
      </ol>
      <div className="space-y-4">
        <div role="group" className="flex flex-wrap gap-2" aria-label="Choose your MCP client">{clients.map((name) => <button type="button" key={name} className="filter-chip" aria-pressed={client === name} aria-controls="mcp-client-setup" onClick={() => setClient(name)}>{name}</button>)}</div>
        <div id="mcp-client-setup" className="space-y-4" aria-live="polite">
        <h3 className="font-semibold">{client} setup</h3>
        <div className="space-y-2 text-sm leading-relaxed text-ink-muted">
          {client === "Cursor" && <p>Save this in <code className="text-ink">.cursor/mcp.json</code> at your project root. Open Cursor Settings, then Tools &amp; MCP. Enable skaleagents and use Connect to complete OAuth.</p>}
          {client === "Claude Code" && <p>Run this in your project directory. Start Claude Code, enter <code className="text-ink">/mcp</code>, select skaleagents, and choose Authenticate.</p>}
          {client === "Claude Desktop" && <><p>Open Customize, then Connectors, and add a custom connector. Name it SkaleAgents and paste this as the remote MCP server URL.</p><p>Leave the advanced OAuth client fields blank. Add the connector, then click Connect to sign in and approve access. Select SkaleAgents in your conversation to use its tools.</p><p className="text-xs">For Team or Enterprise, an owner adds the connector in organization settings first. Custom connector limits depend on your plan.</p></>}
          {client === "ChatGPT" && <><p>Enable Developer mode in Settings, under Security and login. Open <a className="text-ink underline" href="https://chatgpt.com/plugins" target="_blank" rel="noreferrer">ChatGPT Plugins</a>, click the plus button, and name the connection SkaleAgents.</p><p>Paste this as the MCP server URL and choose OAuth authentication. Leave the OAuth client fields blank. Create the connection, approve access, and add it to your conversation from the tools menu.</p><p className="text-xs">Developer mode and custom connections depend on your account and workspace policy.</p></>}
          {client === "Codex" && <p>Add this to <code className="text-ink">~/.codex/config.toml</code>. Run <code className="text-ink">codex mcp login skaleagents</code> to complete OAuth, then use <code className="text-ink">/mcp</code> in Codex to check the connection.</p>}
        </div>
        <pre className="overflow-x-auto rounded-lg border border-line bg-canvas-elevated p-4 font-mono text-xs leading-relaxed">{config}</pre>
        <Button type="button" variant="secondary" onClick={() => void copy(config)}>{copyLabel}</Button>
        </div>
      </div>
      <details className="rounded-lg border border-line bg-canvas-elevated p-4"><summary className="cursor-pointer font-semibold">Need to reconnect?</summary><p className="mt-3 text-sm text-ink-muted">Use Connect or Authenticate in your client&apos;s MCP panel to start OAuth again. For Codex, run <code>codex mcp login skaleagents</code>. If the client timed out while you signed in, retry the connection.</p><p className="mt-3 text-sm text-ink-muted">Your client stores OAuth credentials and refreshes access automatically. Disconnect it below to revoke access. Signing out of this website does not disconnect your MCP clients.</p></details>
      <ArchitectureReviewBrief />
      <div className="grid gap-4 sm:grid-cols-2"><div><h3 className="break-words font-mono text-sm font-semibold">plan_architecture_review</h3><p className="mt-2 text-sm text-ink-muted">Start a consultation with a file inventory, project goals, and a focused set of follow-up questions.</p></div><div><h3 className="break-words font-mono text-sm font-semibold">review_application_architecture</h3><p className="mt-2 text-sm text-ink-muted">Map related source files and check Next.js boundaries. Review the whole design with evidence and questions across data, authorization, reliability, and delivery.</p></div><div><h3 className="font-mono text-sm font-semibold">review_architecture</h3><p className="mt-2 text-sm text-ink-muted">Review an individual source snippet or infrastructure configuration for security, reliability, and cost concerns.</p></div><div><h3 className="font-mono text-sm font-semibold">scan_iac</h3><p className="mt-2 text-sm text-ink-muted">Scan Terraform, CloudFormation, Kubernetes, or Pulumi YAML for resource-level risks, with severity filters and remediation.</p></div></div>
      <p className="text-sm text-ink-muted">Scans read the file text your editor sends. They do not connect to a live cloud account. Results include coverage limits; external modules and runtime behavior are not inspected. Pulumi TypeScript, Python, and Go programs are not parsed yet.</p>
    </section>
  );
}
