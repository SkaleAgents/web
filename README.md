# SkaleAgents Web

**One** Next.js App Router app for marketing + product routes. Not two frontends.

The Laravel **api** repo is JSON-only (no web UI). Browser and MCP talk to it over HTTP.

## Local

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

- `localhost:3000/` → landing
- Product routes: `/login`, `/bot-directory`, `/studio`, `/prompts`, and `/mcp-config`
- Old `/settings` and `/settings/mcp` bookmarks redirect to `/mcp-config`.
- API: Sail on `:8082` (`NEXT_PUBLIC_API_URL`)

Tailscale: `tailscale serve --service=skaleagents-web --bg http://127.0.0.1:3000`

## Auth

1. Open `/login`
2. Continue with Google → API redirect → Google → API callback
3. Shell loads `GET /api/user` via TanStack Query

Local `.env.example` enables the mock callback for smoke work. Production sets it
to `false` and uses the configured Google OAuth client.

## Tests

```bash
pnpm test
pnpm build && pnpm test:e2e
```

## Railway

See hub [railway-deploy.md](https://github.com/SkaleAgents/workspace/blob/main/docs/tech-spec/railway-deploy.md).

- `railway.toml`: `pnpm build` / `pnpm start`
- Variable template: `.env.railway.example` (`NEXT_PUBLIC_*` require redeploy when changed)
- Point `NEXT_PUBLIC_API_URL` at the Railway `api` public URL

## Stack

- Signal Deck tokens (Syne / Source Sans 3 / IBM Plex Mono + teal accent)
- TanStack Query, react-hook-form + Zod, sonner, next-themes
- Browser → `api` Sanctum cookies

Hub: [SkaleAgents/workspace](https://github.com/SkaleAgents/workspace) → `docs/tech-spec/`
