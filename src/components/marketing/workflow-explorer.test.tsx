import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { WorkflowExplorer } from "./workflow-explorer";

afterEach(cleanup);

describe("WorkflowExplorer", () => {
  it("keeps all workflow content in the page and uses native radio selection", async () => {
    const user = userEvent.setup();
    render(<WorkflowExplorer />);

    const assistant = screen.getByRole("radio", { name: "In an AI assistant" });
    const editor = screen.getByRole("radio", { name: "In your editor" });
    const team = screen.getByRole("radio", { name: "In the web app" });

    expect(assistant).toBeChecked();
    expect(document.querySelectorAll("[data-workflow-panel]")).toHaveLength(3);
    expect(screen.getByText("Keep the review beside your code.")).toBeInTheDocument();
    expect(screen.getByText("Take a finding into a shared review.")).toBeInTheDocument();

    await user.click(editor);
    expect(editor).toBeChecked();
    expect(assistant).not.toBeChecked();
    await user.click(team);
    expect(team).toBeChecked();
  });
});
