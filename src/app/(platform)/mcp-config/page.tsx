import { markdownPath } from "@/lib/ai-corpus";
import { McpConnectionGuide } from "@/components/mcp-connection-guide";
import { LinkButton } from "@/components/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP config | SkaleAgents",
  description: "Connect the AI you already use. It checks your application and your infrastructure, then tells you what to change.",
  alternates: { canonical: "/mcp-config", types: { "text/markdown": markdownPath("/mcp-config") } },
};

export default function McpConfigPage() {
  return <main className="space-y-8">
    <div className="workspace-intro"><p className="workspace-kicker">MCP / Work from your editor</p><h1 className="workspace-heading">MCP config</h1><p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted">Connect the AI you already use. It checks your application and your infrastructure, then tells you what to change. Add SkaleAgents to your client, then approve access in your browser. Your client handles credentials automatically.</p></div>
    <McpConnectionGuide />
    <section className="rounded-xl border border-line bg-canvas-elevated p-5"><h2 className="text-xl font-semibold">Manage your connections</h2><p className="my-3 text-sm text-ink-muted">See which clients have access and disconnect them from your dashboard.</p><LinkButton href="/dashboard/mcp-config">Open MCP connections</LinkButton></section>
  </main>;
}
