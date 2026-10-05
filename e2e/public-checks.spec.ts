import { expect, test } from "@playwright/test";

test.use({ headless: true });

test("public checks index lists titles and detail pages still explain the check", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "cf-ipcountry": "US" });
  await page.goto("/checks", { waitUntil: "domcontentloaded" });
  const deny = page.getByRole("button", { name: "Deny" });
  if (await deny.isVisible()) await deny.click();
  await expect(page.getByRole("heading", { name: "What a review actually checks." })).toBeVisible();
  await expect(page.getByText("This page lists the checks a review can run. It does not run a review, connect to a cloud account, or prove that a system is secure.")).toBeVisible();
  await expect(page.getByText("Showing 1–10 of 48")).toBeVisible();
  await expect(page.getByRole("link", { name: "All 48" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Security 37" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Reliability 6" })).toBeVisible();
  await expect(page.getByRole("link", { name: "AI workloads 3" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Scaling and cost 2" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a review" })).toHaveAttribute("href", "/dashboard/jobs");
  await expect(page.getByRole("link", { name: "Set up MCP" })).toHaveAttribute("href", "/mcp-config");
  await expect(page.getByText("The list includes a public database, wildcard permissions")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "What a check cannot do" })).toBeVisible();
  await expect(page.getByText("No findings does not prove the system is secure.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Wildcard IAM permissions" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Public database" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Error rate" })).toHaveCount(0);
  await expect(page.getByText("A database that enables public network access")).toHaveCount(0);
  await page.getByRole("link", { name: "Public database" }).click();
  await page.waitForURL("**/checks/public-database");
  await expect(page.getByText("A database that enables public network access")).toBeVisible();
  await expect(page.getByText("publicly_accessible = true")).toBeVisible();
  await page.goto("/checks/one-connection-pool", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "One-connection pool" })).toBeVisible();
  await expect(page.getByText("pool_size = 1")).toBeVisible();
  await page.getByRole("link", { name: "All review checks" }).click();
  await expect(page.getByText("Showing 1–10 of 48")).toBeVisible();
  await expect(page.getByRole("link", { name: "Wildcard IAM permissions" })).toBeVisible();
});
