import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ORG = "src/app/(platform)/org/[workspaceId]";

function pages(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pages(path);
    return name === "page.tsx" ? [path] : [];
  });
}

// The org layout's title is only a fallback; a page without its own title made every browser tab read "Organization".
describe("dashboard page titles", () => {
  it.each(pages(ORG))("%s sets its own title", (path) => {
    expect(readFileSync(path, "utf8")).toMatch(/export const metadata(: Metadata)? = \{\s*title: "[^"]+ \| SkaleAgents"/);
  });

  it.each(["profile", "passkeys", "notifications", "data"])("account/%s has a title layout", (segment) => {
    expect(readFileSync(`src/app/(platform)/account/${segment}/layout.tsx`, "utf8")).toContain("| SkaleAgents");
  });
});
