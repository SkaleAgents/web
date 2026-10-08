export const SITE = "https://skaleagents.com";

export function markdownPath(path: string): string {
  return path === "/" ? "/index.md" : `${path}.md`;
}

export function absoluteMarkdown(path: string): string {
  return `${SITE}${markdownPath(path)}`;
}
