import { expect, test } from "./fixtures";

const sessionId = "00000000-0000-4000-8000-000000000002";
const jobId = "00000000-0000-4000-8000-000000000001";

test("lost live updates are visible and reconnect reloads the authoritative snapshot", async ({ page }) => {
  await page.addInitScript(() => {
    class Stream extends EventTarget {
      static CLOSED = 2;
      readyState = 0;
      onopen: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor() { super(); (window as unknown as { streams: Stream[] }).streams.push(this); }
      close() { this.readyState = 2; }
      emit(type: string, data?: unknown) {
        if (type === "open") { this.readyState = 1; this.onopen?.(); }
        if (type === "error") { this.readyState = 0; this.onerror?.(); }
        this.dispatchEvent(new MessageEvent(type, { data: JSON.stringify(data) }));
      }
    }
    (window as unknown as { streams: Stream[] }).streams = [];
    window.EventSource = Stream as unknown as typeof EventSource;
  });
  let summary = "Initial snapshot";
  let reads = 0;
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route(`**/api/watchtower/sessions/${sessionId}`, route => route.fulfill({ json: { id: sessionId, jobId, status: "open", participants: [], proposals: [], redirects: [] } }));
  await page.route(`**/api/jobs/${jobId}`, route => {
    reads++;
    return route.fulfill({ json: { id: jobId, status: "completed", summary, scope: {}, specialists: [], findings: [], steps: [] } });
  });
  const emit = (type: string, index = 0, data?: unknown) => page.evaluate(({ type, index, data }) => {
    (window as unknown as { streams: Array<{ emit(type: string, data?: unknown): void }> }).streams[index].emit(type, data);
  }, { type, index, data });
  await page.goto(`/watchtower/${sessionId}`);
  await expect(page.getByText("Connecting live updates…")).toBeVisible();
  await emit("open");
  await expect(page.getByText("Live updates connected")).toBeVisible();
  await expect.poll(() => reads).toBeGreaterThan(1);
  const beforeReconnect = reads;
  await emit("error");
  await expect(page.getByText("Reconnecting live updates. Displayed results may be outdated.")).toBeVisible();
  summary = "Snapshot after reconnect";
  await emit("open");
  await expect(page.getByText(summary, { exact: true })).toBeVisible();
  expect(reads).toBeGreaterThan(beforeReconnect);
  expect(await page.evaluate(() => (window as unknown as { streams: unknown[] }).streams.length)).toBe(1);

  await emit("step", 0, { invalid: true });
  await expect(page.getByText("Live updates disconnected. Displayed results may be outdated.")).toBeVisible();
  await page.getByRole("button", { name: "Reconnect", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { streams: unknown[] }).streams.length)).toBe(2);
  await emit("open", 1);
  await expect(page.getByText("Live updates connected")).toBeVisible();
  await emit("step", 0, { step: { stepId: "late", jobId, message: "Old disconnected stream", agent: "sre", ts: new Date().toISOString() } });
  await expect(page.getByText("Old disconnected stream")).toHaveCount(0);
});
