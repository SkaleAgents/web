import { expect, it } from "vitest";
import nextConfig from "../next.config";

it("forbids framing and MIME sniffing on every page without overriding the share-link referrer rule", async () => {
  const rules = await nextConfig.headers!();
  expect(rules[0].source).toBe("/:path*");
  expect(rules[0].headers).toEqual(expect.arrayContaining([
    { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
    { key: "X-Content-Type-Options", value: "nosniff" },
  ]));
  expect(rules[0].headers).toEqual(expect.arrayContaining([
    { key: "Strict-Transport-Security", value: "max-age=31536000" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ]));
  // Later rules win, so the share-link and sign-in rules must stay after the global one.
  for (const source of ["/reviews/s/:token", "/auth/confirm"]) {
    const index = rules.findIndex((rule) => rule.source === source);
    expect(index).toBeGreaterThan(0);
    expect(rules[index].headers).toContainEqual({ key: "Referrer-Policy", value: "no-referrer" });
  }
});
