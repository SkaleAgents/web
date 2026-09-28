import { describe, expect, it } from "vitest";
import { isValidTimeZone, isoToLocalDateTime, localDateTimeToIso } from "@/lib/advisory-appointment-time";

describe("advisory appointment timezone conversion", () => {
  it("converts wall-clock time with the explicit IANA timezone", () => {
    expect(localDateTimeToIso("2026-09-29T09:00", "America/Los_Angeles")).toBe("2026-09-29T09:00:00-07:00");
    expect(isoToLocalDateTime("2026-09-29T16:00:00Z", "America/Los_Angeles")).toBe("2026-09-29T09:00");
  });

  it("rejects invalid zones and wall times skipped by daylight-saving changes", () => {
    expect(isValidTimeZone("Not/A_Zone")).toBe(false);
    expect(localDateTimeToIso("2026-03-08T02:30", "America/Los_Angeles")).toBeNull();
    expect(localDateTimeToIso("2026-11-01T01:30", "America/Los_Angeles")).toBeNull();
  });
});
