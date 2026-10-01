import { expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { publicCheckBySlug, publicChecks } from "./public-checks";

it("publishes each built-in check once, with the image scan kept honest", () => {
  expect(new Set(publicChecks.map((check) => check.slug)).size).toBe(publicChecks.length);
  expect(new Set(publicChecks.map((check) => check.ruleId)).size).toBe(12);
  const image = publicCheckBySlug("container-image-scan");
  expect(image?.limit).toMatch(/not a clean image report/);
  expect(image?.looksFor).toMatch(/does not scan/i);
  expect(publicCheckBySlug("public-network-access")?.limit).toMatch(/comment/);
  const urls = sitemap().map((entry) => entry.url);
  expect(urls).toContain("https://skaleagents.com/checks");
  expect(urls).toContain("https://skaleagents.com/checks/public-network-access");
  expect(urls.some((url) => url.includes("/dashboard"))).toBe(false);
});
