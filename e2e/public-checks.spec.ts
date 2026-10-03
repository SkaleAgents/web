import { expect, test } from "@playwright/test";

test.use({ headless: true });

test("public checks name infrastructure formats and bottleneck checks", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "cf-ipcountry": "US" });
  await page.goto("/checks", { waitUntil: "domcontentloaded" });
  const deny = page.getByRole("button", { name: "Deny" });
  if (await deny.isVisible()) await deny.click();
  await expect(page.getByRole("heading", { name: "What a review actually checks." })).toBeVisible();
  await expect(page.getByText("a Dockerfile, or a GitHub Actions workflow")).toBeVisible();
  await expect(page.getByText("a container that runs as root")).toBeVisible();
  for (const title of ["Public database", "Wildcard IAM permissions", "Docker socket", "Missing memory limit", "Disabled timeout", "One-connection pool"]) {
    await expect(page.getByRole("link", { name: title })).toBeVisible();
  }
  await page.getByRole("link", { name: "Public database" }).click();
  await page.waitForURL("**/checks/public-database");
  await expect(page.getByText("publicly_accessible = true")).toBeVisible();
  await page.goto("/checks/one-connection-pool", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "One-connection pool" })).toBeVisible();
  await expect(page.getByText("pool_size = 1")).toBeVisible();
  await page.getByRole("link", { name: "All review checks" }).click();
  await expect(page.getByRole("link", { name: "Disabled timeout" })).toBeVisible();
});
