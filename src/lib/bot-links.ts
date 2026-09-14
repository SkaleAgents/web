const GROK_URL = "https://grok.com/";

export function buildGrokPromptUrl(prompt: string): string {
  const url = new URL(GROK_URL);
  url.searchParams.set("q", prompt);
  return url.toString();
}
