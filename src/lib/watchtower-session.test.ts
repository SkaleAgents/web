import { expect, it } from "vitest";
import { watchtowerSessionTitle } from "./watchtower-session";

it("names an open Watchtower review as live and a finished one as closed", () => {
  expect(watchtowerSessionTitle("open")).toBe("Live audit session");
  expect(watchtowerSessionTitle("closed")).toBe("Closed audit session");
});
