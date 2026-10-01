import { expect, test } from "./fixtures";

test("Watchtower distinguishes retained findings from removed proposal copies", async ({ page }) => {
  const jobId = "00000000-0000-4000-8000-000000000001";
  const sessionId = "00000000-0000-4000-8000-000000000002";
  const removed = "[Input unavailable under retention policy]";
  await page.route("**/api/user", route => route.fulfill({ json: { id: "owner", displayName: "Owner" } }));
  await page.route(`**/api/watchtower/sessions/${sessionId}`, route => route.fulfill({ json: {
    id: sessionId, jobId, status: "closed", participants: [], redirects: [],
    proposals: [{ id: "proposal", jobId, sessionId, status: "rejected", finding: { inputAvailable: false, title: removed }, diff: removed, history: [] }],
  } }));
  await page.route(`**/api/jobs/${jobId}`, route => route.fulfill({ json: {
    id: jobId, status: "completed", scope: { kind: "iac_text", format: "terraform" }, sourcePurged: true,
    specialists: ["devsecops"], partial: false, summary: removed, steps: [],
    findings: [
      { id: "finding", classification: "builtin-v1", inputLocatorAvailable: false, severity: "high", specialist: "devsecops", title: "Public network access detected", detail: "The IaC contains an unrestricted IPv4 source range.", resource: "iac", remediation: "Restrict ingress to approved CIDR ranges." },
      ...["legacy-a", "legacy-b"].map(id => ({ id, classification: "unclassified", inputLocatorAvailable: false, severity: "medium", specialist: "sre", title: removed, detail: removed, resource: removed, remediation: removed })),
    ],
  } }));
  const errors: string[] = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(`/watchtower/${sessionId}`);
  await expect(page.getByText("Public network access detected", { exact: true })).toBeVisible();
  await expect(page.getByText("Finding retained without source. Original resource locator removed.")).toBeVisible();
  await expect(page.getByText("Unclassified finding text removed with input.")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Generate safe proposals" })).toHaveCount(0);
  expect(errors.filter(message => message.includes("same key"))).toEqual([]);
});
