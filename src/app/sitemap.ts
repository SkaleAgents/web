import type { MetadataRoute } from "next";
import { loadPublicBots } from "@/lib/public-catalog";
import { publicCheckPath, publicChecks } from "@/lib/public-checks";

const publicPaths = [
  "/",
  "/bots",
  "/prompts",
  "/checks",
  ...publicChecks.map((check) => publicCheckPath(check)),
  "/mcp-config",
  "/pricing",
  "/products",
  "/contact",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://skaleagents.com";
  const bots = await loadPublicBots();
  const paths = [...publicPaths, ...(bots ?? []).map((bot) => `/bots/${bot.id}`)];
  return paths.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : path.startsWith("/checks") ? 0.8 : 0.7,
  }));
}
