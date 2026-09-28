"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, type Bot, type SwarmJob } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { LinkButton } from "@/components/ui";

const tools = [
  { href: "/dashboard/workspaces", title: "Organizations", detail: "Manage memberships and invitations." },
  { href: "/dashboard/studio", title: "Creator Studio", detail: "Write a bot, refine its instructions, and publish when ready." },
  { href: "/dashboard/prompts", title: "My prompts", detail: "Save instructions for your next review." },
  { href: "/dashboard/mcp-config", title: "MCP connections", detail: "Connect your editor and manage its access." },
  { href: "/dashboard/settings", title: "Account settings", detail: "Manage notifications, security, and retention." },
];

export default function DashboardPage() {
  const user = useQuery(currentUserOptions);
  const accountId = user.data?.id;
  const jobs = useQuery({ queryKey: ["swarm-jobs", accountId ?? "guest"], enabled: Boolean(accountId),
    queryFn: async ({ signal }) => (await apiFetch<{ jobs: SwarmJob[] }>("/api/jobs", { signal })).jobs });
  const schedules = useQuery({ queryKey: ["dashboard-schedules", accountId], enabled: Boolean(accountId),
    queryFn: async ({ signal }) => (await apiFetch<{ schedules: { id: string }[] }>("/api/schedules", { signal })).schedules });
  const bots = useQuery({ queryKey: ["bots", accountId ?? "guest"], enabled: Boolean(accountId),
    queryFn: async ({ signal }) => (await apiFetch<{ bots: Bot[] }>("/api/bots", { signal })).bots });
  const stats = [
    { label: "Audit jobs", href: "/dashboard/jobs", value: jobs.data?.length, error: jobs.isError },
    { label: "Scheduled audits", href: "/dashboard/schedules", value: schedules.data?.length, error: schedules.isError },
    { label: "My bots", href: "/dashboard/bots", value: bots.data?.filter(bot => bot.ownerUserId === accountId).length, error: bots.isError },
  ];
  const recent = [...(jobs.data ?? [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 5);

  return <main className="space-y-8">
    <div className="workspace-intro flex flex-wrap items-end justify-between gap-4">
      <div><p className="workspace-kicker">Your account</p><h1 className="workspace-heading">Dashboard</h1>
        <p className="mt-3 text-sm text-ink-muted">Welcome back{user.data?.displayName ? `, ${user.data.displayName.split(" ")[0]}` : ""}. What are you working on today?</p></div>
      <LinkButton href="/dashboard/jobs">Start an audit</LinkButton>
    </div>
    <section aria-label="Account overview" className="grid gap-4 sm:grid-cols-3">
      {stats.map(stat => <Link key={stat.href} href={stat.href} className="rounded-xl border border-line bg-canvas-elevated p-5 transition-colors hover:border-accent">
        <p className="text-sm text-ink-muted">{stat.label}</p>
        <p className="mt-3 font-display text-3xl font-bold">{stat.error ? <span className="text-sm font-normal text-danger">Unavailable</span> : stat.value ?? "…"}</p>
        <p className="mt-3 text-xs text-ink-muted">Open {stat.label.toLowerCase()} ↗</p>
      </Link>)}
    </section>
    <section aria-labelledby="recent-audits" className="rounded-xl border border-line bg-canvas-elevated p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="recent-audits" className="text-lg font-semibold">Recent audits</h2><Link href="/dashboard/jobs" className="text-sm font-semibold text-accent">View all audits</Link></div>
      {jobs.isPending ? <p className="mt-4 text-sm text-ink-muted">Loading audits…</p> : jobs.isError ? <p role="alert" className="mt-4 text-sm text-danger">Could not load audits. Open Audit jobs to retry.</p> : recent.length === 0 ? <div className="py-8"><p className="font-medium">Your first review starts here.</p><p className="mt-2 text-sm text-ink-muted">Paste infrastructure text and choose specialists to review it.</p><LinkButton href="/dashboard/jobs" variant="secondary" className="mt-4">Create your first audit</LinkButton></div> : <ul className="mt-4 divide-y divide-line">{recent.map(job => <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="min-w-0"><Link href="/dashboard/jobs" className="break-words text-sm font-medium hover:underline">{job.summary || `Audit ${job.id}`}</Link><p className="mt-1 text-xs text-ink-muted">{new Date(job.createdAt).toLocaleString()}</p></div><span className="rounded-full border border-line px-3 py-1 text-xs capitalize">{job.status}</span>
      </li>)}</ul>}
    </section>
    <section aria-labelledby="manage-account"><h2 id="manage-account" className="mb-4 text-lg font-semibold">Explore your account</h2><div className="grid gap-4 sm:grid-cols-2">{tools.map(tool => <Link key={tool.href} href={tool.href} className="rounded-xl border border-line p-5 transition-colors hover:bg-canvas-elevated"><h3 className="font-semibold">{tool.title} <span aria-hidden="true" className="text-accent">↗</span></h3><p className="mt-2 text-sm text-ink-muted">{tool.detail}</p></Link>)}</div></section>
  </main>;
}
