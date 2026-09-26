import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["hcl2-parser", "typescript"],
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
      { source: "/settings/mcp", destination: "/mcp-config", permanent: false },
    ];
  },
};

export default nextConfig;
