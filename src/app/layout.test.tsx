import { describe, expect, it, vi } from "vitest";
import { metadata } from "./layout";

vi.mock("next/font/google", () => ({ Inter: () => ({ variable: "" }), IBM_Plex_Mono: () => ({ variable: "" }) }));
vi.mock("next/font/local", () => ({ default: () => ({ variable: "" }) }));

describe("root metadata", () => {
  it("carries the directory verification meta tags", () => {
    expect(metadata.verification?.other).toEqual({
      "legit-verify": "legit-2MrtiFvxovstJ9r1H4tYdEM01NGL",
      "websitelaunches-verification": "366e7873e47a4dbe81506cc32827066a",
    });
  });
});
