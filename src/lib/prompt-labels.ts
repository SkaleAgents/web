const categoryLabels: Record<string, string> = {
  devsecops: "Security",
  security: "Security",
  sre: "Reliability",
  reliability: "Reliability",
  mlops: "AI workloads",
  scaling: "Scaling and cost",
  devops: "DevOps",
  ops: "Operations",
  general: "General",
};

const typeTags = new Set(["community"]);

export function promptType(ownerUserId: string | null): "Community" | "Yours" {
  return ownerUserId ? "Yours" : "Community";
}

export function promptCategories(tags: string[]): string[] {
  return [...new Set(tags
    .map((tag) => tag.trim())
    .filter((tag) => tag && !typeTags.has(tag.toLowerCase()))
    .map((tag) => categoryLabels[tag.toLowerCase()] ?? tag))];
}

export function promptCategoryLabel(tags: string[]): string {
  const categories = promptCategories(tags);
  return categories.length ? categories.join(", ") : "General";
}
