# SkaleAgents Web

**One** Next.js App Router app for marketing + product (host / path routing). Not two frontends.

The Laravel **api** repo is JSON-only (no web UI). Browser and MCP talk to it over HTTP.

## Local

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

- `localhost:3000` → product (`/app…`)
- `/marketing` or a marketing host → landing
- API: Sail on `:8082` (`NEXT_PUBLIC_API_URL`)

Tailscale: `tailscale serve --service=skaleagents-web --bg http://127.0.0.1:3000`

## Auth (Phase 1 mock)

1. Open `/app/login`
2. Mock code + display name → CSRF + `POST /api/auth/grok/callback`
3. Shell loads `GET /api/user` via TanStack Query

## Tests

```bash
pnpm test
pnpm build && pnpm test:e2e
```

## Stack

- Signal Deck tokens (Syne / Source Sans 3 / IBM Plex Mono + teal accent)
- TanStack Query, react-hook-form + Zod, sonner, next-themes
- Browser → `api` Sanctum cookies

Hub: [SkaleAgents/workspace](https://github.com/SkaleAgents/workspace) → `docs/tech-spec/`
