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

## Stack

- Next.js + TanStack Query
- Browser → Laravel `api` with Sanctum cookies (no full BFF)

Hub: [SkaleAgents/workspace](https://github.com/SkaleAgents/workspace) → `docs/tech-spec/`
