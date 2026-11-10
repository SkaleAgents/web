import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, friendlyMessage } from "./api";

afterEach(() => vi.unstubAllGlobals());

function respond(status: number, body: unknown, statusText = "") {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(typeof body === "string" ? body : JSON.stringify(body), { status, statusText })));
}

describe("friendlyMessage", () => {
  it("keeps a message the API wrote on purpose", () => {
    expect(friendlyMessage(503, "Unable to enqueue audit tasks", "Service Unavailable")).toBe("Unable to enqueue audit tasks");
    expect(friendlyMessage(422, "The scope field is required.", "Unprocessable Content")).toBe("The scope field is required.");
    expect(friendlyMessage(401, "That sign-in link has expired.", "Unauthorized")).toBe("That sign-in link has expired.");
  });

  it("replaces framework and proxy defaults with a sentence", () => {
    expect(friendlyMessage(500, "Server Error", "Internal Server Error")).toMatch(/our side/);
    expect(friendlyMessage(502, "Bad Gateway", "Bad Gateway")).toMatch(/our side/);
    expect(friendlyMessage(504, "", "")).toMatch(/our side/);
    expect(friendlyMessage(401, "Unauthenticated.", "Unauthorized")).toMatch(/session has expired/);
    expect(friendlyMessage(401, "Unauthorized", "Unauthorized")).toMatch(/session has expired/);
    expect(friendlyMessage(429, "Too Many Attempts.", "Too Many Requests")).toMatch(/a little fast/);
  });
});

describe("apiFetch errors", () => {
  it("rewords a failed connection instead of showing 'Failed to fetch'", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    await expect(apiFetch("/api/jobs")).rejects.toMatchObject({ name: "ApiError", status: 0, message: expect.stringMatching(/couldn't reach SkaleAgents/) });
  });

  it("turns an HTML error page from a proxy into a sentence", async () => {
    respond(502, "<html><body>Bad gateway</body></html>", "Bad Gateway");
    const error = await apiFetch("/api/jobs").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toMatch(/our side/);
    expect((error as ApiError).status).toBe(502);
  });

  it("tells an expired session what to do and keeps the status for callers", async () => {
    respond(401, { message: "Unauthenticated." }, "Unauthorized");
    const error = await apiFetch("/api/jobs").catch((caught: unknown) => caught);
    expect((error as ApiError).message).toMatch(/Sign in again/);
    expect((error as ApiError).status).toBe(401);
  });

  it("does not reword a cancelled request", async () => {
    const abort = new DOMException("The operation was aborted.", "AbortError");
    vi.stubGlobal("fetch", vi.fn(async () => { throw abort; }));
    await expect(apiFetch("/api/jobs")).rejects.toBe(abort);
  });
});
