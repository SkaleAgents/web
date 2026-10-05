import { expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { publicCheckBySlug, publicChecks } from "./public-checks";

it("publishes each built-in check once, with the image scan kept honest", async () => {
  expect(new Set(publicChecks.map((check) => check.slug)).size).toBe(publicChecks.length);
  expect(new Set(publicChecks.map((check) => check.ruleId)).size).toBe(36);
  expect(publicChecks.map((check) => check.title)).toEqual(expect.arrayContaining([
    "Public database", "Wildcard IAM permissions", "Docker socket", "Missing memory limit", "Disabled timeout", "One-connection pool",
    "Container runs as root", "Remote script piped to a shell", "Pull request target checkout of PR code", "Action pinned to @main",
    "Secret file copied into an image", "Workflow prints a secret", "Workflow permissions are broad",
    "Secret assigned in an image variable", "Secret assigned in workflow env", "Helm privileged container", "Ansible task runs as root",
    "Storage encryption disabled", "Database backups disabled", "Possible AWS access key", "Private key material in source",
    "Pipeline prints a secret", "Unpinned pipeline image", "Secret assigned in a Terraform variable", "Public input on a Terraform module",
  ]));
  const image = publicCheckBySlug("container-image-scan");
  expect(image?.limit).toMatch(/not a clean image report/);
  expect(image?.looksFor).toMatch(/does not scan/i);
  expect(publicCheckBySlug("public-network-access")?.limit).toMatch(/comment/);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.reject(new Error("offline"));
  let urls: string[] = [];
  try {
    urls = (await sitemap()).map((entry) => entry.url);
  } finally {
    globalThis.fetch = originalFetch;
  }
  expect(urls).toContain("https://skaleagents.com/checks");
  expect(urls).toContain("https://skaleagents.com/checks/public-network-access");
  expect(urls.some((url) => url.includes("/dashboard"))).toBe(false);
});
