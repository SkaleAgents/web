import type { Bot } from "@/lib/api";

export function relatedReviewers(bots: Bot[], current: Pick<Bot, "id" | "specialty" | "integrations">, limit = 3): {
  heading: "Related reviewers" | "More reviewers";
  bots: Bot[];
} {
  const currentTools = current.integrations ?? [];
  const others = bots.filter((bot) => bot.id !== current.id && bot.visibility === "public" && bot.status === "published");
  const ranked = others
    .map((bot) => {
      const sameSpecialty = bot.specialty === current.specialty ? 2 : 0;
      const sharedTool = (bot.integrations ?? []).some((tool) => currentTools.includes(tool)) ? 1 : 0;
      return { bot, score: sameSpecialty + sharedTool };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.bot.name.localeCompare(b.bot.name));

  if (ranked.length > 0) {
    return { heading: "Related reviewers", bots: ranked.slice(0, limit).map((item) => item.bot) };
  }

  return {
    heading: "More reviewers",
    bots: [...others].sort((a, b) => a.name.localeCompare(b.name)).slice(0, limit),
  };
}
