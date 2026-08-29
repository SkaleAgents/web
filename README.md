# SkaleAgents Web

One Next.js App Router app with **host-based routing** (marketing + product).

## Local

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

- Default `localhost:3000` → product (`/app`)
- Set `Host: skaleagents.com` (or add to `MARKETING_HOSTS`) → marketing

Tailscale: `tailscale serve --service=skaleagents-web --bg http://127.0.0.1:3000`

## Auth (Phase 1 mock)

With Sail API on `:8082` and `NEXT_PUBLIC_API_URL=http://localhost:8082`:

1. Open `/app/login` (or `/login` on app hosts — rewritten to `/app/login`)
2. Submit mock code + display name → CSRF cookie + `POST /api/auth/grok/callback`
3. Shell loads `GET /api/user` via TanStack Query (~45s `staleTime`, refetch on focus)

## Tests

```bash
pnpm test          # Vitest unit
pnpm build && pnpm test:e2e   # Playwright page smokes (needs Chromium once: pnpm exec playwright install chromium)
```

## Stack

- Next.js App Router + TanStack Query + react-hook-form/Zod + sonner + next-themes
- Browser → Laravel `api` with Sanctum cookies (no full BFF)

Hub: [SkaleAgents/workspace](https://github.com/SkaleAgents/workspace) → `docs/tech-spec/`
