import { afterEach, expect, it, vi } from "vitest";
import { completeSignIn } from "./email-auth";

function signIn(redirect: string) {
  const assign = vi.fn();
  vi.stubGlobal("location", { origin: "http://localhost:3000", search: "", assign });
  completeSignIn({ ok: true, redirect });
  return assign.mock.calls[0][0];
}

afterEach(() => vi.unstubAllGlobals());

it("only follows same-origin or API-origin redirects", () => {
  expect(signIn("/me/jobs")).toBe("http://localhost:3000/me/jobs");
  expect(signIn("http://localhost:8082/oauth/authorize?state=a")).toBe("http://localhost:8082/oauth/authorize?state=a");
  expect(signIn("https://evil.example/phish")).toBe("/dashboard");
  expect(signIn("//evil.example/phish")).toBe("/dashboard");
  expect(signIn("javascript:alert(1)")).toBe("/dashboard");
});
