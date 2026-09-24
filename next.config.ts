import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["hcl2-parser", "typescript"],
};

export default nextConfig;
