/** Split comma-separated prompt tags from the create form. */
export function parsePromptTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
