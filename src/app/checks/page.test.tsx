import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { publicCheckPath, publicChecks } from "@/lib/public-checks";
import PublicCheckPage from "./[slug]/page";
import PublicChecksPage from "./page";

afterEach(() => cleanup());

it("lists check titles without repeating what each check looks for", () => {
  const { container } = render(<PublicChecksPage />);
  const text = container.textContent ?? "";

  expect(screen.getByText("Public reference / No account required")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "What a review actually checks." })).toBeInTheDocument();
  expect(screen.getByText("This page lists the checks a review can run. It does not run a review, connect to a cloud account, or prove that a system is secure.")).toBeInTheDocument();
  expect(screen.getByText(`${publicChecks.length} checks. Open a check to read what it looks for.`)).toBeInTheDocument();
  expect(text).not.toContain("The list includes a public database, wildcard permissions");
  expect(screen.getByRole("link", { name: "Start a review" })).toHaveAttribute("href", "/dashboard/jobs");
  expect(screen.getByRole("link", { name: "Set up MCP" })).toHaveAttribute("href", "/mcp-config");

  for (const area of ["Security", "Reliability", "AI workloads", "Scaling and cost"] as const) {
    const count = publicChecks.filter((check) => check.area === area).length;
    expect(screen.getByRole("heading", { name: `${area} ${count}` })).toBeInTheDocument();
  }

  const html = container.innerHTML;
  for (const check of publicChecks) {
    expect(text).toContain(check.title);
    expect(text).not.toContain(check.looksFor);
    expect(html).toContain(`href="${publicCheckPath(check)}"`);
  }

  expect(screen.getByRole("heading", { name: "What a check cannot do" })).toBeInTheDocument();
  expect(screen.getByText("It reads the text you submit. It does not call a cloud account.")).toBeInTheDocument();
  expect(screen.getByText("A value is resolved only when the literal is in the files you submit.")).toBeInTheDocument();
  expect(screen.getByText("No findings does not prove the system is secure.")).toBeInTheDocument();

  const data = JSON.parse(container.querySelector('script[type="application/ld+json"]')?.textContent ?? "{}") as {
    "@type": string;
    itemListElement: { name: string; url: string }[];
  };
  expect(data["@type"]).toBe("ItemList");
  expect(data.itemListElement.map((item) => item.name)).toEqual(publicChecks.map((check) => check.title));
  expect(data.itemListElement[0]?.url).toBe(`https://skaleagents.com${publicCheckPath(publicChecks[0])}`);
});

it("still shows what a check looks for on its detail page", async () => {
  const check = publicChecks.find((item) => item.slug === "public-database");
  expect(check).toBeDefined();
  render(await PublicCheckPage({ params: Promise.resolve({ slug: "public-database" }) }));
  expect(screen.getByText(check!.looksFor)).toBeInTheDocument();
});
