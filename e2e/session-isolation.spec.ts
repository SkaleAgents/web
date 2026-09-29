import { expect, test, type Page } from "./fixtures";

async function openReviewPage(page: Page, name: "Audit jobs" | "Scheduled audits") {
  const navigation = page.getByRole("navigation", { name: "Dashboard navigation" });
  await navigation.getByRole("link", { name: new RegExp(`^${name}`) }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
}

function job(owner: string) {
  return { id: `job-${owner}`, status: "completed", summary: `${owner} private audit`, specialists: ["sre"], createdAt: "2026-09-24T00:00:00Z" };
}

function schedule(owner: string) {
  return { id: `schedule-${owner}`, name: `${owner} private schedule`, cronExpression: "0 9 * * *", timezone: "UTC", enabled: true, nextRunAt: null };
}

test("logout removes cached jobs and schedules across client navigation", async ({ page }) => {
  let signedIn = true;
  let guestRequests = 0;
  await page.route("**/api/user", (route) => route.fulfill(signedIn ? { json: { id: "alice", displayName: "Alice" } } : { status: 401, json: {} }));
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/auth/logout", (route) => {
    signedIn = false;
    return route.fulfill({ json: { ok: true } });
  });
  for (const resource of ["jobs", "schedules"] as const) {
    await page.route(`**/api/${resource}`, (route) => {
      if (!signedIn) {
        guestRequests++;
        return route.fulfill({ status: 401, json: { message: "Unauthenticated" } });
      }
      return route.fulfill({ json: resource === "jobs" ? { jobs: [job("Alice")] } : { schedules: [schedule("Alice")] } });
    });
  }

  await page.goto("/jobs");
  await expect(page.getByText("Alice private audit", { exact: true })).toBeVisible();
  await openReviewPage(page, "Scheduled audits");
  await expect(page.getByText("Alice private schedule", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Alice, account menu" }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login(?:\?next=.*)?$/);

  await page.goto("/me/jobs");
  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(page.getByText("Alice private audit", { exact: true })).toHaveCount(0);
  await page.goto("/me/schedules");
  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(page.getByText("Alice private schedule", { exact: true })).toHaveCount(0);
  expect(guestRequests).toBe(0);
});

test("a late private response cannot repopulate the cache after logout", async ({ page }) => {
  let signedIn = true;
  let scheduleRequested = false;
  let release!: () => void;
  const delayed = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/user", (route) => route.fulfill(signedIn ? { json: { id: "alice", displayName: "Alice" } } : { status: 401, json: {} }));
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/auth/logout", (route) => {
    signedIn = false;
    return route.fulfill({ json: { ok: true } });
  });
  await page.route("**/api/schedules", async (route) => {
    scheduleRequested = true;
    await delayed;
    await route.fulfill({ json: { schedules: [schedule("Alice")] } }).catch(() => {});
  });
  await page.goto("/schedules");
  await expect.poll(() => scheduleRequested).toBe(true);
  await page.getByRole("button", { name: "Alice, account menu" }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login(?:\?next=.*)?$/);
  release();
  await page.goto("/me/schedules");
  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(page.getByText("Alice private schedule", { exact: true })).toHaveCount(0);
});

test("an account change isolates private queries and clears local form state", async ({ page }) => {
  let owner = "Alice";
  await page.clock.install();
  await page.route("**/api/user", (route) => route.fulfill({ json: { id: owner, displayName: owner } }));
  await page.route("**/api/jobs", (route) => route.fulfill({ json: { jobs: [job(owner)] } }));
  await page.goto("/jobs");
  await expect(page.getByText("Alice private audit", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "New audit" }).first().click();
  await page.getByRole("textbox", { name: "IaC content", exact: true }).fill("Alice unsaved private source");
  owner = "Bob";
  await page.clock.fastForward(46_000);
  await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
  await expect(page.getByRole("button", { name: "Bob, account menu" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "IaC content", exact: true })).toHaveValue("");
  await page.getByRole("link", { name: "Back to audit jobs" }).click();
  await expect(page.getByText("Bob private audit", { exact: true })).toBeVisible();
  await expect(page.getByText("Alice private audit", { exact: true })).toHaveCount(0);
});

test("failed logout keeps the current account and lets the user retry", async ({ page }) => {
  let fail = true;
  await page.route("**/api/user", (route) => route.fulfill({ json: { id: "alice", displayName: "Alice" } }));
  await page.route("**/api/jobs", (route) => route.fulfill({ json: { jobs: [job("Alice")] } }));
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/auth/logout", (route) => route.fulfill(fail ? { status: 503, json: { message: "Sign out unavailable" } } : { json: { ok: true } }));
  await page.goto("/jobs");
  await expect(page.getByText("Alice private audit", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Alice, account menu" }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByText("Sign out unavailable", { exact: true })).toBeVisible();
  await expect(page.getByText("Alice private audit", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Close toast", exact: true }).click();
  fail = false;
  await page.getByRole("button", { name: "Alice, account menu" }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login(?:\?next=.*)?$/);
});
