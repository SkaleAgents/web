import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { WorkflowExplorer } from "@/components/marketing/workflow-explorer";
import { McpConnectionGuide } from "./mcp-connection-guide";

afterEach(() => cleanup());

it("shows hosted OAuth and the public database line change", () => {
  const { container } = render(<McpConnectionGuide />);
  const text = container.textContent ?? "";
  expect(text).toContain("https://skaleagents.com/mcp");
  expect(text).toContain("Sign in with Google and click Allow.");
  expect(text).toContain("Database publicly accessible.");
  expect(text).toContain("publicly_accessible = true becomes publicly_accessible = false");
  expect(text).not.toContain("Create token");
  expect(text).not.toContain("API token");
  expect(text).not.toContain("npx");
});

it("tells the editor workflow to add the hosted URL and approve OAuth", () => {
  const { container } = render(<WorkflowExplorer />);
  const editor = container.querySelector("[data-workflow-panel='editor']");
  const text = editor?.textContent ?? "";
  expect(text).toContain("https://skaleagents.com/mcp");
  expect(text).toContain("choose OAuth");
  expect(text).toContain("Click Allow");
  expect(text).not.toContain("npx");
  expect(text).not.toContain("local stdio");
  expect(text).not.toContain("@skaleagents/swarm locally");
});
