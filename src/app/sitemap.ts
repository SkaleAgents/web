import type { MetadataRoute } from "next";
import { BOT_INTEGRATIONS } from "@/lib/api";
import { loadCommunityPrompts, loadPublicBots } from "@/lib/public-catalog";
import { publicCheckPath, publicChecks } from "@/lib/public-checks";
import { publicPostPath, publicPosts } from "@/lib/public-posts";
import { publicResourcePath, publicResources } from "@/lib/public-resources";

const publicPaths = [
  "/",
  "/bots",
  "/bots/integrations",
  ...BOT_INTEGRATIONS.map((item) => `/bots/integrations/${item.slug}`),
  "/prompts",
  "/checks",
  ...publicChecks.map((check) => publicCheckPath(check)),
  "/resources",
  ...publicResources.map((resource) => publicResourcePath(resource)),
  "/blog",
  ...publicPosts.map((post) => publicPostPath(post)),
  "/mcp-config",
  "/pricing",
  "/products",
  "/contact",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://skaleagents.com";
  const [bots, prompts] = await Promise.all([loadPublicBots(), loadCommunityPrompts()]);
  const paths = [
    ...publicPaths,
    ...(bots ?? []).map((bot) => `/bots/${bot.id}`),
    ...(prompts ?? []).map((prompt) => `/prompts/${prompt.id}`),
  ];
  return paths.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : path.startsWith("/checks") || path.startsWith("/resources") || path.startsWith("/blog") ? 0.8 : 0.7,
  }));
}
