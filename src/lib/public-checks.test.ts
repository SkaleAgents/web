import { expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { publicCheckBySlug, publicCheckProposedChange, publicChecks } from "./public-checks";

it("publishes each built-in check once, with the image scan kept honest", async () => {
  expect(new Set(publicChecks.map((check) => check.slug)).size).toBe(publicChecks.length);
  expect(new Set(publicChecks.map((check) => check.ruleId)).size).toBe(48);
  expect(publicChecks.map((check) => check.title)).toEqual(expect.arrayContaining([
    "Public database", "Wildcard IAM permissions", "Docker socket", "Missing memory limit", "Disabled timeout", "One-connection pool",
    "Container runs as root", "Remote script piped to a shell", "Pull request target checkout of PR code", "Action pinned to @main",
    "Secret file copied into an image", "Workflow prints a secret", "Workflow permissions are broad",
    "Secret assigned in an image variable", "Secret assigned in workflow env", "Helm privileged container", "Ansible task runs as root",
    "Storage encryption disabled", "Database backups disabled", "Possible AWS access key", "Private key material in source",
    "Pipeline prints a secret", "Unpinned pipeline image", "Secret assigned in a Terraform variable", "Public input on a Terraform module",
    "Secret assigned in a Terraform local", "Secret assigned in serverless environment", "IAM policy allows every action",
    "Referenced value is public", "Referenced secret", "IAM condition allows every address",
    "Substituted value is public", "Policy allows any principal",
    "Joined value is public", "Mapped value is public",
    "Package script pipes a download to a shell", "Dependency range is floating",
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
  expect(publicCheckProposedChange(publicCheckBySlug("public-database")!)).toBe("publicly_accessible = true becomes publicly_accessible = false");
  expect(publicCheckProposedChange(publicCheckBySlug("container-runs-as-root")!)).toBe("USER root becomes USER nobody");
  expect(publicCheckProposedChange(publicCheckBySlug("workflow-permissions-are-broad")!)).toBe("permissions: write-all becomes permissions: contents: read");
  expect(publicCheckProposedChange(publicCheckBySlug("elevated-container-privileges")!)).toBe("privileged: true becomes privileged: false");
  expect(publicCheckProposedChange(publicCheckBySlug("helm-privileged-container")!)).toBe("privileged: true becomes privileged: false");
  expect(publicCheckProposedChange(publicCheckBySlug("storage-encryption-disabled")!)).toBe("storage_encrypted = false becomes storage_encrypted = true");
  const checkout = publicCheckProposedChange(publicCheckBySlug("pull-request-target-checkout")!);
  expect(checkout).toContain("ref: ${{ github.event.pull_request.head.ref }}");
  expect(checkout).toContain("removed");
  expect(checkout).not.toContain("becomes");
  expect(publicCheckProposedChange(publicCheckBySlug("public-network-access")!)).toBeNull();
  expect(publicCheckProposedChange(publicCheckBySlug("error-rate")!)).toBeNull();
  expect(urls).toContain("https://skaleagents.com/checks");
  expect(urls).toContain("https://skaleagents.com/checks/public-network-access");
  expect(urls.some((url) => url.includes("/dashboard"))).toBe(false);
});
