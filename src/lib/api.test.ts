import { describe, expect, it } from "vitest";
import { SPECIALTIES } from "./api";

describe("SPECIALTIES", () => {
  it("matches OpenAPI specialty enum", () => {
    expect(SPECIALTIES).toEqual([
      "devops",
      "devsecops",
      "sre",
      "mlops",
      "scaling",
      "general",
    ]);
  });
});

describe("parsePromptTags", () => {
  it("splits and trims comma-separated tags", async () => {
    const { parsePromptTags } = await import("./tags");
    expect(parsePromptTags(" sre , ops, ,devops ")).toEqual([
      "sre",
      "ops",
      "devops",
    ]);
  });
});
