import { describe, expect, it } from "vitest";
import { buildGithubScheduleScope } from "./github-schedule-source";

describe("buildGithubScheduleScope", () => {
  it("builds a public GitHub file reference", () => {
    expect(buildGithubScheduleScope("acme/infra", "k8s/deployment.yaml", "main", "kubernetes"))
      .toEqual({ kind: "repo_ref", format: "kubernetes", ref: "github:acme/infra:k8s/deployment.yaml@main" });
  });

  it("rejects a URL or traversal path", () => {
    expect(() => buildGithubScheduleScope("https://github.com/acme/infra", "k8s/a.yaml", "main", "kubernetes")).toThrow();
    expect(() => buildGithubScheduleScope("acme/infra", "../secret", "main", "kubernetes")).toThrow();
    expect(() => buildGithubScheduleScope("acme/..", "k8s/a.yaml", "main", "kubernetes")).toThrow();
  });
});
