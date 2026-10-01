import { API_URL, type Bot, type Prompt } from "@/lib/api";

export function publishedPublicBots(bots: Bot[]): Bot[] {
  return bots.filter((bot) => bot.visibility === "public" && bot.status === "published");
}

export function communityPrompts(prompts: Prompt[]): Prompt[] {
  return prompts.filter((prompt) => !prompt.ownerUserId);
}

async function readJson<T>(path: string): Promise<T | undefined> {
  try {
    const response = await fetch(`${API_URL}${path}`, { next: { revalidate: 300 } });
    if (!response.ok) return undefined;
    return await response.json() as T;
  } catch {
    return undefined;
  }
}

export async function loadPublicBots(): Promise<Bot[] | undefined> {
  const data = await readJson<{ bots: Bot[] }>("/api/bots");
  return data ? publishedPublicBots(data.bots) : undefined;
}

export async function loadPublicBot(id: string): Promise<Bot | undefined> {
  const bot = await readJson<Bot>(`/api/bots/${encodeURIComponent(id)}`);
  if (!bot || bot.visibility !== "public" || bot.status !== "published") return undefined;
  return bot;
}

export async function loadCommunityPrompts(): Promise<Prompt[] | undefined> {
  const data = await readJson<{ prompts?: Prompt[] }>("/api/prompts");
  return data?.prompts ? communityPrompts(data.prompts) : undefined;
}

export async function loadCommunityPrompt(id: string): Promise<Prompt | undefined> {
  const prompts = await loadCommunityPrompts();
  return prompts?.find((prompt) => prompt.id === id);
}
