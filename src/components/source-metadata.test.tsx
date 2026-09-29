import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SourceMetadata } from "@/components/source-metadata";

describe("SourceMetadata", () => {
  afterEach(cleanup);
  it("shows legacy null fields as unknown", () => {
    render(<SourceMetadata sourceRevision={null} sourceObservedAt={null} />);

    expect(screen.getByText("Caller-reported source revision: unknown")).toBeInTheDocument();
    expect(screen.getByText("Caller-reported source observation time: unknown")).toBeInTheDocument();
  });

  it("hides caller metadata when input is unavailable", () => {
    render(<SourceMetadata sourceRevision="private-revision" sourceObservedAt="2026-09-25T10:30:00Z" inputAvailable={false} />);

    expect(screen.getByText("Input unavailable. Source metadata is hidden.")).toBeInTheDocument();
    expect(screen.queryByText(/private-revision/)).not.toBeInTheDocument();
    expect(screen.queryByText(/2026-09-25/)).not.toBeInTheDocument();
  });

  it("labels a fetched GitHub commit without calling it caller-reported", () => {
    render(<SourceMetadata sourceRevision="abc123" sourceObservedAt="2026-09-29T12:00:00Z" verified />);

    expect(screen.getByText("Fetched commit: abc123")).toBeInTheDocument();
    expect(screen.queryByText(/Caller-reported source revision/)).not.toBeInTheDocument();
  });
});
