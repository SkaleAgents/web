import { LinkButton } from "@/components/ui";

export default function AppHome() {
  return (
    <main className="space-y-4">
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
        Home
      </h1>
      <p className="max-w-xl text-ink-muted">
        Soft client navigation + TanStack Query cache. Auth is mock Grok via
        Laravel Sanctum cookies on the API (no separate UI there).
      </p>
      <div className="flex flex-wrap gap-3">
        <LinkButton href="/app/login">Sign in</LinkButton>
        <LinkButton href="/app/bots" variant="secondary">
          Bot directory
        </LinkButton>
        <LinkButton href="/app/studio" variant="secondary">
          Studio
        </LinkButton>
      </div>
    </main>
  );
}
