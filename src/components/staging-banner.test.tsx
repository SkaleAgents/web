import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { StagingBanner } from "./staging-banner";

afterEach(() => vi.unstubAllEnvs());

it("warns that this is staging and that payments are test only", () => {
  vi.stubEnv("NEXT_PUBLIC_APP_ENV", "staging");
  render(<StagingBanner />);
  expect(screen.getByRole("status")).toHaveTextContent(/staging environment.*test mode.*no real money/i);
});

it("renders nothing outside staging", () => {
  vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production");
  const { container } = render(<StagingBanner />);
  expect(container).toBeEmptyDOMElement();
});
