import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/me", "/org/", "/staff/", "/login", "/auth/", "/workspace-invitations/"] }],
    sitemap: "https://skaleagents.com/sitemap.xml",
  };
}
