import { markdownDocument, type DirectoryEntry, type PublicPageDetail, type PublicPlan } from "@/lib/ai-corpus";
import { io } from "next/cache";
import { loadCommunityPrompt, loadCommunityPrompts, loadPublicBot, loadPublicBots } from "@/lib/public-catalog";

export const revalidate = 3600;

async function loadJson<T>(path: string): Promise<T | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "https://api.skaleagents.com";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch(`${base}${path}`, { signal: controller.signal, next: { revalidate: 3600 } });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function extrasFor(path: string): Promise<{ plans?: PublicPlan[] | null; directory?: DirectoryEntry[] | null; detail?: PublicPageDetail | null }> {
  if (path === "/pricing") {
    const catalog = await loadJson<{ data: PublicPlan[] }>("/api/organization-plans");
    return { plans: catalog?.data ?? null };
  }
  if (path === "/bots") {
    const bots = await loadPublicBots();
    return {
      directory: bots?.map((bot) => ({ name: bot.name, href: `/bots/${bot.id}.md`, detail: `${bot.specialty}. ${bot.description}` })) ?? null,
    };
  }
  if (path === "/prompts") {
    const prompts = await loadCommunityPrompts();
    return {
      directory: prompts?.map((prompt) => ({
        name: prompt.title,
        href: `/prompts/${prompt.id}.md`,
        detail: prompt.tags.length > 0 ? prompt.tags.join(", ") : "Community prompt",
      })) ?? null,
    };
  }
  const botId = singlePublicId(path, "/bots/");
  if (botId) {
    const bot = await loadPublicBot(botId);
    return {
      detail: bot
        ? { kind: "bot", name: bot.name, specialty: bot.specialty, description: bot.description, instructions: bot.promptBody }
        : { kind: "missing" },
    };
  }
  const promptId = singlePublicId(path, "/prompts/");
  if (promptId) {
    const prompt = await loadCommunityPrompt(promptId);
    return {
      detail: prompt
        ? { kind: "prompt", title: prompt.title, tags: prompt.tags, body: prompt.body }
        : { kind: "missing" },
    };
  }
  return {};
}

function singlePublicId(path: string, prefix: string): string | null {
  if (!path.startsWith(prefix)) return null;
  const id = path.slice(prefix.length);
  if (!/^[a-z0-9-]+$/.test(id)) return null;
  return id;
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string[] }> }) {
  const slug = (await context.params).slug;
  if (slug[0] !== "public") {
    return new Response("Not found\n", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  const rest = slug.slice(1);
  const path = rest.length === 1 && rest[0] === "index" ? "/" : `/${rest.join("/")}`;
  const scheduled = path === "/blog" || path.startsWith("/blog/");
  if (scheduled) await io();
  const body = markdownDocument(path, await extrasFor(path));
  if (!body) return new Response("Not found\n", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  return new Response(body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": scheduled ? "public, max-age=60" : "public, max-age=3600",
      "x-robots-tag": "index, follow",
    },
  });
}
