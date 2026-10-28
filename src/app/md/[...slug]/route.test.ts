import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("markdown route", () => {
  it("points the canonical at the HTML page", async () => {
    const response = await GET(new Request("https://skaleagents.com/terms.md"), { params: Promise.resolve({ slug: ["public", "terms"] }) });
    expect(response.status).toBe(200);
    expect(response.headers.get("link")).toBe('<https://skaleagents.com/terms>; rel="canonical"');
  });

  it("maps the index document to the home page", async () => {
    const response = await GET(new Request("https://skaleagents.com/index.md"), { params: Promise.resolve({ slug: ["public", "index"] }) });
    expect(response.headers.get("link")).toBe('<https://skaleagents.com/>; rel="canonical"');
  });
});
