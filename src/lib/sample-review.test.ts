import { describe, expect, it } from "vitest";
import { IMPROVED_SAMPLE, ORIGINAL_SAMPLE, reviewSample } from "./sample-review";

describe("local sample review", () => {
  it("updates findings as each sample setting is configured", () => {
    expect(reviewSample(ORIGINAL_SAMPLE).findings?.filter((finding) => finding.configured)).toHaveLength(0);
    const partial = reviewSample(JSON.stringify({ replicas: 2, readinessProbe: false, memoryLimitMi: 256 }));
    expect(partial.findings?.filter((finding) => !finding.configured).map((finding) => finding.field)).toEqual(["readinessProbe"]);
    expect(reviewSample(IMPROVED_SAMPLE).findings?.every((finding) => finding.configured)).toBe(true);
  });

  it.each([
    "not JSON",
    "null",
    "[]",
    "{}",
    '{"replicas":2,"readinessProbe":"true","memoryLimitMi":512}',
    '{"replicas":1.5,"readinessProbe":true,"memoryLimitMi":512}',
    '{"replicas":-1,"readinessProbe":true,"memoryLimitMi":512}',
    '{"replicas":2,"readinessProbe":true,"memoryLimitMi":0}',
    '{"replicas":2,"readinessProbe":true,"memoryLimitMi":1e309}',
    '{"replicas":2,"readinessProbe":true,"memoryLimitMi":512,"unrecognized":true}',
  ])("does not report findings for invalid or unsupported input: %s", (source) => {
    const result = reviewSample(source);
    expect(result.error).toBeTruthy();
    expect(result.findings).toBeNull();
  });

  it("distinguishes a paused deployment from a single replica", () => {
    const result = reviewSample('{"replicas":0,"readinessProbe":true,"memoryLimitMi":128}');
    expect(result.error).toBeNull();
    expect(result.findings?.[0]).toMatchObject({ configured: false, title: "No running replicas" });
  });
});
