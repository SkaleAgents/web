import Link from "next/link";

export default function MarketingHome() {
  return (
    <main className="relative flex min-h-full flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(900px 420px at 12% -10%, var(--accent-soft), transparent 60%),
            repeating-linear-gradient(
              -18deg,
              transparent,
              transparent 11px,
              color-mix(in srgb, var(--line) 55%, transparent) 11px,
              color-mix(in srgb, var(--line) 55%, transparent) 12px
            )
          `,
        }}
      />

      <div className="motion-enter relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-20">
        <p className="font-display text-[clamp(2.75rem,8vw,4.5rem)] font-bold leading-[0.95] tracking-tight text-ink">
          SkaleAgents
        </p>
        <h1 className="mt-5 max-w-xl text-xl font-medium leading-snug text-ink sm:text-2xl">
          Control plane for AI DevOps agents
        </h1>
        <p className="mt-3 max-w-md text-base leading-relaxed text-ink-muted">
          Sign in with Google, publish specialist agents, connect MCP from your
          IDE — one control plane for AI DevOps work.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/app/login"
            className="inline-flex items-center rounded-[10px] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg transition hover:brightness-110"
          >
            Sign in
          </Link>
          <Link
            href="/app/bots"
            className="inline-flex items-center rounded-[10px] border border-line bg-transparent px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-accent-soft"
          >
            Browse directory
          </Link>
        </div>
      </div>
    </main>
  );
}
