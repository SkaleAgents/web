import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["hcl2-parser", "typescript"],
  redirects() {
    return [
      { source: "/settings/mcp", destination: "/mcp-config", permanent: false },
    ];
  },
};

export default nextConfig;
