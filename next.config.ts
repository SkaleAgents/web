import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["hcl2-parser", "typescript"],
  rewrites() {
    return [
      { source: "/me", destination: "/dashboard" },
      { source: "/me/organizations", destination: "/dashboard/workspaces" },
      { source: "/me/:path*", destination: "/dashboard/:path*" },
      { source: "/dashboard/organizations", destination: "/dashboard/workspaces" },
      { source: "/staff/:path*", destination: "/dashboard/staff/:path*" },
    ];
  },
  headers() {
    const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082").origin;
    return [{ source: "/reviews/s/:token", headers: [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "Cache-Control", value: "no-store, private" },
    ] }, { source: "/auth/confirm", headers: [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "Cache-Control", value: "no-store, private" },
      { key: "Content-Security-Policy", value: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; connect-src 'self' ${apiOrigin}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` },
    ] }];
  },
  redirects() {
    return [
      { source: "/bots", destination: "/bot-directory", permanent: true },
      { source: "/bots.md", destination: "/bot-directory.md", permanent: true },
      { source: "/bots/:path*", destination: "/bot-directory/:path*", permanent: true },
      { source: "/bot-directory/categories", destination: "/bot-directory/specialties", permanent: true },
      { source: "/bot-directory/categories/:slug", destination: "/bot-directory/specialties/:slug", permanent: true },
      { source: "/settings/mcp", destination: "/dashboard/mcp-config", permanent: false },
      { source: "/account/settings", destination: "/account/passkeys", permanent: false },
      { source: "/account/security", destination: "/account/passkeys", permanent: false },
      { source: "/dashboard/workspaces/:workspaceId/retention", destination: "/org/:workspaceId/settings/retention", permanent: false },
      { source: "/dashboard/workspaces/:workspaceId/:path*", destination: "/org/:workspaceId/:path*", permanent: false },
      { source: "/dashboard/workspaces/:workspaceId", destination: "/org/:workspaceId", permanent: false },
      { source: "/dashboard/workspaces", destination: "/dashboard/organizations", permanent: false },
      { source: "/dashboard/billing", has: [{ type: "query", key: "organization", value: "(?<workspaceId>[0-9a-fA-F-]{36})" }], destination: "/org/:workspaceId/billing", permanent: false },
      { source: "/dashboard/billing", destination: "/dashboard/organizations", permanent: false },
      { source: "/me/billing", has: [{ type: "query", key: "organization", value: "(?<workspaceId>[0-9a-fA-F-]{36})" }], destination: "/org/:workspaceId/billing", permanent: false },
      { source: "/me/billing", destination: "/me/organizations", permanent: false },
      { source: "/dashboard/staff/:path*", destination: "/staff/:path*", permanent: false },
      { source: "/workspaces", destination: "/dashboard/organizations", permanent: false },
      { source: "/workspaces/:workspaceId/:path*", destination: "/org/:workspaceId/:path*", permanent: false },
      ...["jobs", "schedules", "settings", "studio", "watchtower"].map(path => ({
        source: `/${path}/:path*`, destination: `/dashboard/${path}/:path*`, permanent: false,
      })),
    ];
  },
};

export default nextConfig;
