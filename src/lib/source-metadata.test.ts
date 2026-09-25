import { describe, expect, it } from "vitest";
import { buildSourceMetadata } from "@/lib/source-metadata";

describe("buildSourceMetadata", () => {
  it("omits metadata when both optional values are blank", () => {
    expect(buildSourceMetadata("", "")).toEqual({});
  });

  it("requires the revision and timestamp as a pair", () => {
    expect(() => buildSourceMetadata("rev-1", "")).toThrow("Enter both a source revision and observation time");
    expect(() => buildSourceMetadata("", "2026-09-25T10:30")).toThrow("Enter both a source revision and observation time");
  });

  it("converts the caller-entered local time to RFC 3339 UTC", () => {
    expect(buildSourceMetadata(" rev-1 ", "2026-09-25T10:30:00")).toEqual({
      sourceRevision: "rev-1",
      sourceObservedAt: new Date("2026-09-25T10:30:00").toISOString(),
    });
  });

  it("rejects overlong revisions and invalid times", () => {
    expect(() => buildSourceMetadata("r".repeat(256), "2026-09-25T10:30")).toThrow("255 characters or fewer");
    expect(() => buildSourceMetadata("rev-1", "invalid")).toThrow("valid source observation time");
  });
});
