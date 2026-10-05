import { expect, test } from "@playwright/test";

test.use({ headless: true });

test("public checks index lists titles and detail pages still explain the check", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "cf-ipcountry": "US" });
  await page.goto("/checks", { waitUntil: "domcontentloaded" });
  const deny = page.getByRole("button", { name: "Deny" });
  if (await deny.isVisible()) await deny.click();
  await expect(page.getByRole("heading", { name: "What a review actually checks." })).toBeVisible();
  await expect(page.getByText("This page lists the checks a review can run. It does not run a review, connect to a cloud account, or prove that a system is secure.")).toBeVisible();
  await expect(page.getByText(/\d+ checks\. Open a check to read what it looks for\./)).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a review" })).toHaveAttribute("href", "/dashboard/jobs");
  await expect(page.getByRole("link", { name: "Set up MCP" })).toHaveAttribute("href", "/mcp-config");
  await expect(page.getByText("The list includes a public database, wildcard permissions")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "What a check cannot do" })).toBeVisible();
  await expect(page.getByText("No findings does not prove the system is secure.")).toBeVisible();
  for (const title of ["Public database", "Wildcard IAM permissions", "Docker socket", "Missing memory limit", "Disabled timeout", "One-connection pool"]) {
    await expect(page.getByRole("link", { name: title })).toBeVisible();
  }
  await expect(page.getByText("A database that enables public network access")).toHaveCount(0);
  await page.getByRole("link", { name: "Public database" }).click();
  await page.waitForURL("**/checks/public-database");
  await expect(page.getByText("A database that enables public network access")).toBeVisible();
  await expect(page.getByText("publicly_accessible = true")).toBeVisible();
  await page.goto("/checks/one-connection-pool", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "One-connection pool" })).toBeVisible();
  await expect(page.getByText("pool_size = 1")).toBeVisible();
  await page.getByRole("link", { name: "All review checks" }).click();
  await expect(page.getByRole("link", { name: "Disabled timeout" })).toBeVisible();
});
