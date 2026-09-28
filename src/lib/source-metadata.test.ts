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

  it.each([
    ["2026-09-25T10:30:00Z", "2026-09-25T10:30:00Z"],
    ["2026-09-25T10:30:45+06:00", "2026-09-25T04:30:45Z"],
    ["2026-09-25T23:30:00-04:00", "2026-09-26T03:30:00Z"],
  ])("serializes %s with the API's whole-second UTC precision", (input, expected) => {
    expect(buildSourceMetadata(" rev-1 ", input)).toEqual({
      sourceRevision: "rev-1",
      sourceObservedAt: expected,
    });
  });

  it("rejects overlong revisions and invalid times", () => {
    expect(() => buildSourceMetadata("r".repeat(256), "2026-09-25T10:30")).toThrow("255 characters or fewer");
    expect(() => buildSourceMetadata("rev-1", "invalid")).toThrow("valid source observation time");
  });
});
