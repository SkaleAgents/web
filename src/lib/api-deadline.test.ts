import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ApiTimeoutError, API_REQUEST_TIMEOUT_MS, ensureCsrfCookie, watchtowerFetch } from "./api";

describe("API request deadlines", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it("bounds a hanging request and aborts its transport without retrying a mutation", async () => {
    let signal: AbortSignal | undefined;
    const fetcher = vi.fn((_url, init) => { signal = init.signal; return new Promise<Response>(() => {}); });
    vi.stubGlobal("fetch", fetcher);
    const request = apiFetch("/api/jobs", { method: "POST", body: "{}" });
    const result = expect(request).rejects.toBeInstanceOf(ApiTimeoutError);
    await vi.advanceTimersByTimeAsync(API_REQUEST_TIMEOUT_MS);
    await result;
    expect(signal?.aborted).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps the deadline active while consuming a stalled response body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => new Promise(() => {}) }));
    const result = expect(apiFetch("/api/jobs")).rejects.toBeInstanceOf(ApiTimeoutError);
    await vi.advanceTimersByTimeAsync(API_REQUEST_TIMEOUT_MS);
    await result;
  });

  it("honors caller cancellation and rejects already aborted requests before fetching", async () => {
    const fetcher = vi.fn(() => new Promise(() => {}));
    vi.stubGlobal("fetch", fetcher);
    const controller = new AbortController();
    const reason = new DOMException("Account changed", "AbortError");
    const request = apiFetch("/api/jobs", { signal: controller.signal });
    controller.abort(reason);
    await expect(request).rejects.toBe(reason);
    await expect(apiFetch("/api/jobs", { signal: controller.signal })).rejects.toBe(reason);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects failed CSRF preparation before a Watchtower mutation", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    vi.stubGlobal("fetch", fetcher);
    await expect(watchtowerFetch("/sessions", { method: "POST", body: "{}" })).rejects.toMatchObject({ status: 503 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("bounds CSRF preparation and clears the deadline after a successful read", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) }));
    await expect(apiFetch("/api/health")).resolves.toEqual({ ok: true });
    expect(vi.getTimerCount()).toBe(0);
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const result = expect(ensureCsrfCookie()).rejects.toBeInstanceOf(ApiTimeoutError);
    await vi.advanceTimersByTimeAsync(API_REQUEST_TIMEOUT_MS);
    await result;
  });
});
