"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui";

const TOKEN_PLACEHOLDER = "<paste-token-here>";

function buildMcpConfig(token: string | null, apiUrl: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        skaleagents: {
          command: "npx",
          args: ["-y", "@skaleagents/swarm"],
          env: {
            SKALEAGENTS_API_TOKEN: token ?? TOKEN_PLACEHOLDER,
            PLATFORM_API_URL: apiUrl,
          },
        },
      },
    },
    null,
    2,
  );
}

export function McpConnectionGuide({
  token,
  apiUrl,
}: {
  token: string | null;
  apiUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const [client, setClient] = useState("Cursor");
  const config = buildMcpConfig(token, apiUrl);

  async function copyConfig() {
    try {
      await navigator.clipboard.writeText(config);
      setCopied(true);
      toast.success(
        token
          ? "MCP config copied"
          : "Config copied. Add your token before use",
      );
    } catch {
      setCopied(false);
      toast.error("Could not copy the MCP config");
    }
  }

  return (
    <section className="space-y-5 rounded-[10px] border border-accent/40 bg-accent-soft p-5">
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-accent">
          MCP connection
        </p>
        <h2 className="mt-1 text-xl font-semibold text-ink">
          Set up your editor
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Your AI client runs the local stdio server beside your project. It can
          send relevant application code, Terraform, CloudFormation, or
          Kubernetes content to SkaleAgents for review without giving us direct
          access to your repository.
        </p>
      </div>

      <ol className="grid gap-3 text-sm text-ink sm:grid-cols-3">
        <li className="rounded-[10px] border border-line bg-canvas-elevated p-3">
          <strong className="block">1. Create a token</strong>
          <span className="mt-1 block text-ink-muted">Sign in, then create a named token on this page.</span>
        </li>
        <li className="rounded-[10px] border border-line bg-canvas-elevated p-3">
          <strong className="block">2. Add the config</strong>
          <span className="mt-1 block text-ink-muted">
            Paste it into your AI client.
          </span>
        </li>
        <li className="rounded-[10px] border border-line bg-canvas-elevated p-3">
          <strong className="block">3. Run a review</strong>
          <span className="mt-1 block text-ink-muted">
            Ask your model to inspect the project.
          </span>
        </li>
      </ol>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2" aria-label="Choose your MCP client">{["Cursor", "Claude Code", "Other clients"].map((name) => <button type="button" key={name} className="filter-chip" aria-pressed={client === name} onClick={() => { setClient(name); setCopied(false); }}>{name}</button>)}</div>
        <div>
          <h3 className="font-semibold text-ink">
            {client}
          </h3>
          <p className="mt-1 text-sm text-ink-muted">
            {client === "Cursor" ? <>Save the configuration in <code className="font-mono text-ink">.cursor/mcp.json</code> in your project. Open Cursor Settings, then Tools & MCP, and check that skaleagents is enabled.</> : client === "Claude Code" ? <>Save the configuration in <code className="font-mono text-ink">.mcp.json</code> at your project root. Start Claude Code, approve the project server when prompted, then use <code className="font-mono text-ink">/mcp</code> to check its status.</> : <>Use a client that supports local stdio MCP servers. Set the command to <code>npx</code>, arguments to <code>-y @skaleagents/swarm</code>, and copy the environment values below into its server configuration.</>}
          </p>
        </div>
        <pre className="overflow-x-auto whitespace-pre rounded-[10px] border border-line bg-canvas-elevated p-3 font-mono text-xs leading-relaxed text-ink">
          {config}
        </pre>
        <Button type="button" variant="secondary" onClick={() => void copyConfig()}>
          {copied ? "Copied config" : "Copy MCP config"}
        </Button>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-[10px] border border-line bg-canvas-elevated p-3">
          <code className="font-mono text-ink">review_architecture</code>
          <p className="mt-1 text-ink-muted">
            Review application code and infrastructure with a security,
            reliability, cost, or general focus.
          </p>
        </div>
        <div className="rounded-[10px] border border-line bg-canvas-elevated p-3">
          <code className="font-mono text-ink">scan_iac_stub</code>
          <p className="mt-1 text-ink-muted">
            Count Terraform, CloudFormation, or Kubernetes resource patterns.
            This tool reports resource counts; use Audit jobs for a specialist review.
          </p>
        </div>
      </div>

      <p className="text-xs text-ink-muted">
        After connecting, ask your model: “Review this app and its
        infrastructure with SkaleAgents. Call review_architecture with the
        relevant source and IaC, then explain findings and safe remediation.”
      </p>
    </section>
  );
}
