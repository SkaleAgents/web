import { LinkButton } from "@/components/ui";

export default function AppHome() {
  return (
    <main className="space-y-4">
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
        Control plane
      </h1>
      <p className="max-w-xl text-ink-muted">
        Publish specialist agents, reuse prompts, and connect MCP from your IDE.
        The bot directory is one surface — studio and API tokens complete the
        loop.
      </p>
      <div className="flex flex-wrap gap-3">
        <LinkButton href="/app/login">Sign in with Google</LinkButton>
        <LinkButton href="/app/studio" variant="secondary">
          Studio
        </LinkButton>
        <LinkButton href="/app/bots" variant="secondary">
          Bot directory
        </LinkButton>
        <LinkButton href="/app/settings" variant="secondary">
          API tokens
        </LinkButton>
      </div>
    </main>
  );
}
