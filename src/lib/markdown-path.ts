export function markdownInternalPath(pathname: string): string | null {
  if (!pathname.endsWith(".md")) return null;
  const stripped = pathname.slice(0, -3);
  if (stripped === "/index") return "/md/public/index";
  if (!/^\/[a-z0-9/-]+$/.test(stripped)) return null;
  return `/md/public${stripped}`;
}
