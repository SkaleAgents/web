import { expect, it } from "vitest";
import nextConfig from "../next.config";

it("forbids framing and MIME sniffing on every page without overriding the share-link referrer rule", async () => {
  const rules = await nextConfig.headers!();
  expect(rules[0].source).toBe("/:path*");
  expect(rules[0].headers).toEqual(expect.arrayContaining([
    { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
    { key: "X-Content-Type-Options", value: "nosniff" },
  ]));
  expect(rules[0].headers.some((header) => header.key === "Referrer-Policy")).toBe(false);
});
