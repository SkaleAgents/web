import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/jobs", "/settings", "/mcp-config", "/watchtower/", "/advisory-bookings"] }],
    sitemap: "https://skaleagents.com/sitemap.xml",
  };
}
