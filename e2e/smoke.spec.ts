import { test, expect } from "@playwright/test";

test.describe("Phase 1 page smokes", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/user", route => route.fulfill({ status: 401, json: {} }));
  });
  test("login page shows email and Google sign-in", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /Sign in to your control plane/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("link", { name: "Continue with Google" }),
    ).toBeVisible();
  });

  test("directory page renders shell", async ({ page }) => {
    await page.goto("/bots");
    await expect(
      page.getByRole("heading", { name: /Bot directory/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("banner").getByRole("button", { name: "Account menu" }),
    ).toBeVisible();
    await expect(page.getByText("Deferred", { exact: true })).not.toBeVisible();
  });

  test("prompts page is readable without auth", async ({ page }) => {
    await page.goto("/prompts");
    await expect(
      page.getByRole("heading", { name: /Prompt library/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Manage your prompts" })).toBeVisible();
  });

  test("marketing landing shows Signal Deck brand hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("SkaleAgents").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Control plane for AI DevOps agents/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("banner").getByRole("button", { name: "Account menu" }),
    ).toBeVisible();
    await expect(page.getByRole("contentinfo")).toContainText("SkaleAgents");
  });

  test("MCP config page explains the connection", async ({ page }) => {
    await page.goto("/mcp-config");
    await expect(
      page.getByRole("heading", { name: /MCP config/i }),
    ).toBeVisible();
    await expect(page.getByText(/Your client handles credentials automatically/i)).toBeVisible();
  });

  test("audit page explains the signed-in workflow", async ({ page }) => {
    await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: /Audit jobs/i })).toBeVisible();
    await page.getByRole("link", { name: "New audit" }).first().click();
    await expect(page.getByRole("heading", { name: /Start an IaC audit/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Telemetry JSON" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Specialists" })).toBeVisible();
  });

  test("schedule page explains recurring audits", async ({ page }) => {
    await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
    await page.goto("/schedules");
    await expect(page.getByRole("heading", { name: /Scheduled audits/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Create a schedule/i })).toBeVisible();
  });

  test("every public route uses the shared menu and sign-in action", async ({ page }) => {
    await page.route("**/api/user", (route) => route.fulfill({ status: 401, json: {} }));
    for (const path of ["/", "/bots", "/prompts", "/mcp-config"]) {
      await page.goto(path);
      await expect(page.getByRole("navigation")).toBeVisible();
      await expect(page.getByRole("navigation").getByRole("button")).toHaveCount(2);
      await expect(page.getByRole("navigation").getByRole("link", { name: "Home", exact: true })).toHaveCount(0);
      await expect(page.getByRole("link", { name: "SkaleAgents home" })).toHaveAttribute("href", "/");
      await expect(page.getByRole("banner").getByRole("button", { name: "Account menu" })).toBeVisible();
    }
  });

  test("two isolated users share one Watchtower session", async ({ browser }) => {
    const jobId = "00000000-0000-4000-8000-000000000001";
    const sessionId = "00000000-0000-4000-8000-000000000002";
    const users = [
      { id: "00000000-0000-4000-8000-000000000011", displayName: "User One" },
      { id: "00000000-0000-4000-8000-000000000012", displayName: "User Two" },
    ];
    const participants: Array<{ userId: string; joinedAt: string }> = [];
    let sessionStatus: "open" | "closed" = "open";
    const job = {
      id: jobId,
      status: "completed",
      requestedBy: users[0].id,
      scope: { content: 'cidr_blocks = ["0.0.0.0/0"]' },
      specialists: ["devsecops"],
      partial: false,
      findings: [],
      steps: [],
      summary: "Audit complete.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    async function setup(context: Awaited<ReturnType<typeof browser.newContext>>, user: (typeof users)[number]) {
      await context.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }));
      await context.route("**/api/user", (route) => route.fulfill({ json: user }));
      await context.route("**/api/jobs", (route) => route.fulfill({ json: { jobs: [job] } }));
      await context.route(`**/api/jobs/${jobId}`, (route) => route.fulfill({ json: job }));
      await context.route("**/api/watchtower/**", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.pathname.endsWith("/sessions") && request.method() === "POST") {
          if (!participants.some((item) => item.userId === user.id)) {
            participants.push({ userId: user.id, joinedAt: new Date().toISOString() });
          }
          await route.fulfill({ status: 201, json: { id: sessionId, jobId, status: "open", participants, createdAt: new Date().toISOString() } });
          return;
        }
        if (url.pathname.endsWith(`/sessions/${sessionId}/stream`)) {
          await route.fulfill({ status: 200, headers: { "content-type": "text/event-stream" }, body: ": connected\n\n" });
          return;
        }
        if (url.pathname.endsWith(`/sessions/${sessionId}/close`) && request.method() === "POST") {
          sessionStatus = "closed";
          await route.fulfill({ status: 200, json: { id: sessionId, jobId, status: sessionStatus, participants, closedAt: new Date().toISOString() } });
          return;
        }
        if (url.pathname.endsWith(`/sessions/${sessionId}/redirect`) && request.method() === "POST") {
          const body = JSON.parse(request.postData() ?? "{}");
          await route.fulfill({ status: 201, json: { id: "00000000-0000-4000-8000-000000000003", sessionId, jobId, userId: user.id, instruction: body.instruction, createdAt: new Date().toISOString() } });
          return;
        }
        if (url.pathname.endsWith(`/sessions/${sessionId}`)) {
          await route.fulfill({ status: 200, json: { id: sessionId, jobId, status: sessionStatus, participants, createdAt: new Date().toISOString() } });
          return;
        }
        await route.fulfill({ status: 404, json: { error: "Not found" } });
      });
    }

    const contextOne = await browser.newContext();
    const contextTwo = await browser.newContext();
    try {
      await setup(contextOne, users[0]);
      await setup(contextTwo, users[1]);
      const pageOne = await contextOne.newPage();
      const pageTwo = await contextTwo.newPage();
      await pageOne.goto("/jobs");
      await pageOne.getByRole("button", { name: "Open Watchtower" }).click();
      await expect(pageOne).toHaveURL(new RegExp(`/watchtower/${sessionId}$`));
      await pageTwo.goto("/jobs");
      await pageTwo.getByRole("button", { name: "Open Watchtower" }).click();
      await expect(pageTwo).toHaveURL(new RegExp(`/watchtower/${sessionId}$`));
      await expect(pageTwo.getByText("Participants: 2")).toBeVisible();
      await pageOne.reload();
      await expect(pageOne.getByText("Participants: 2")).toBeVisible();
      await pageOne.getByRole("textbox", { name: "Redirect instruction" }).fill("Prioritize recovery.");
      await pageOne.getByRole("button", { name: "Send redirect" }).click();
      await expect(pageOne.getByText("Prioritize recovery.")).toBeVisible();
      await pageOne.getByRole("button", { name: "Close session" }).click();
      await expect(pageOne.getByRole("button", { name: "Close session" })).toBeHidden();
    } finally {
      await contextOne.close();
      await contextTwo.close();
    }
  });
});
