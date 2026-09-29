import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["hcl2-parser", "typescript"],
  rewrites() {
    return [
      { source: "/me", destination: "/dashboard" },
      { source: "/me/organizations", destination: "/dashboard/workspaces" },
      { source: "/me/:path*", destination: "/dashboard/:path*" },
      { source: "/org/:workspaceId/jobs", destination: "/dashboard/workspaces/:workspaceId/jobs" },
      { source: "/org/:workspaceId/jobs/new", destination: "/dashboard/workspaces/:workspaceId/jobs/new" },
      { source: "/org/:workspaceId/schedules", destination: "/dashboard/workspaces/:workspaceId/schedules" },
      { source: "/org/:workspaceId/settings/retention", destination: "/dashboard/workspaces/:workspaceId/retention" },
      { source: "/staff/:path*", destination: "/dashboard/staff/:path*" },
    ];
  },
  headers() {
    const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082").origin;
    return [{ source: "/auth/confirm", headers: [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "Cache-Control", value: "no-store, private" },
      { key: "Content-Security-Policy", value: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; connect-src 'self' ${apiOrigin}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` },
    ] }];
  },
  redirects() {
    return [
      { source: "/settings/mcp", destination: "/me/mcp-config", permanent: false },
      { source: "/dashboard/workspaces/:workspaceId/retention", destination: "/org/:workspaceId/settings/retention", permanent: false },
      { source: "/dashboard/workspaces/:workspaceId/:path*", destination: "/org/:workspaceId/:path*", permanent: false },
      { source: "/dashboard/workspaces/:workspaceId", destination: "/org/:workspaceId", permanent: false },
      { source: "/dashboard/workspaces", destination: "/me/organizations", permanent: false },
      { source: "/dashboard/billing", has: [{ type: "query", key: "organization", value: "(?<workspaceId>[0-9a-fA-F-]{36})" }], destination: "/org/:workspaceId/billing", permanent: false },
      { source: "/dashboard/billing", destination: "/me/organizations", permanent: false },
      { source: "/dashboard/staff/:path*", destination: "/staff/:path*", permanent: false },
      { source: "/dashboard", destination: "/me", permanent: false },
      { source: "/dashboard/:path*", destination: "/me/:path*", permanent: false },
      { source: "/workspaces", destination: "/me/organizations", permanent: false },
      { source: "/workspaces/:workspaceId/:path*", destination: "/org/:workspaceId/:path*", permanent: false },
      ...["jobs", "schedules", "settings", "studio", "watchtower", "advisory-bookings"].map(path => ({
        source: `/${path}/:path*`, destination: `/me/${path}/:path*`, permanent: false,
      })),
    ];
  },
};

export default nextConfig;
