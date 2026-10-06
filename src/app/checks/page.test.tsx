import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { publicCheckPath, publicChecks } from "@/lib/public-checks";
import PublicCheckPage from "./[slug]/page";
import PublicChecksPage from "./page";

afterEach(() => cleanup());

function listLinks(container: HTMLElement) {
  return [...container.querySelectorAll("ul li a")].map((link) => link.textContent);
}

it("lists the first page of checks and every category filter", async () => {
  const { container } = render(await PublicChecksPage({ searchParams: Promise.resolve({}) }));
  const text = container.textContent ?? "";

  expect(screen.getByText("Public reference / No account required")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "What a review actually checks." })).toBeInTheDocument();
  expect(screen.getByText("This page lists the checks a review can run. It does not run a review, connect to a cloud account, or prove that a system is secure.")).toBeInTheDocument();
  expect(screen.getByText("Showing 1\u201310 of 48")).toBeInTheDocument();
  expect(container.innerHTML).toContain("Showing 1\u201310 of 48");
  expect(text).not.toContain("The list includes a public database, wildcard permissions");
  expect(screen.getByRole("link", { name: "Start a review" })).toHaveAttribute("href", "/dashboard/jobs");
  expect(screen.getByRole("link", { name: "Set up MCP" })).toHaveAttribute("href", "/mcp-config");

  for (const label of ["All 48", "Security 37", "Reliability 6", "AI workloads 3", "Scaling and cost 2"]) {
    expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
  }
  expect(screen.getByRole("link", { name: "All 48" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Security 37" })).toHaveAttribute("href", "/checks?category=security");
  expect(screen.getByRole("link", { name: "Reliability 6" })).toHaveAttribute("href", "/checks?category=reliability");

  const security = publicChecks.filter((check) => check.area === "Security");
  const visible = security.slice(0, 10);
  expect(listLinks(container)).toEqual(visible.map((check) => check.title));
  expect(listLinks(container)[4]).toBe("Public database");
  expect(container.querySelectorAll("ul li a")).toHaveLength(10);
  const rows = [...container.querySelectorAll("ul li")];
  const database = rows.find((row) => row.querySelector("a")?.textContent === "Public database");
  const network = rows.find((row) => row.querySelector("a")?.textContent === "Public network access");
  expect(database?.textContent).toContain("Proposes a line change");
  expect(network?.textContent).not.toContain("Proposes a line change");
  expect(listLinks(container)).not.toContain(security[10]?.title);
  for (const check of publicChecks) expect(text).not.toContain(check.looksFor);

  expect(screen.getByText("Previous")).toHaveAttribute("aria-disabled", "true");
  expect(screen.getByText("1", { selector: "[aria-current='page']" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "2" })).toHaveAttribute("href", "/checks?page=2");
  expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/checks?page=2");

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
  expect(data.itemListElement).toHaveLength(publicChecks.length);
  expect(data.itemListElement[0]?.url).toBe(`https://skaleagents.com${publicCheckPath(publicChecks[0])}`);
});

it("puts the fifth security check fifth on the default page", async () => {
  const { container } = render(await PublicChecksPage({ searchParams: Promise.resolve({}) }));
  const security = publicChecks.filter((check) => check.area === "Security");
  const titles = listLinks(container);
  expect(titles).toEqual(security.slice(0, 10).map((check) => check.title));
  expect(titles[4]).toBe(security[4]?.title);
  expect(titles[4]).toBe("Public database");
});

it("shows reliability checks on one page", async () => {
  const { container } = render(await PublicChecksPage({ searchParams: Promise.resolve({ category: "reliability" }) }));
  const reliability = publicChecks.filter((check) => check.area === "Reliability");

  expect(screen.getByText("Showing 1\u20136 of 6")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Reliability 6" })).toHaveAttribute("aria-current", "page");
  expect(listLinks(container)).toEqual(reliability.map((check) => check.title));
  expect(listLinks(container)).not.toContain("Public network access");
  expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "2" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Next" })).not.toBeInTheDocument();
});

it("shows the second page of security checks", async () => {
  const { container } = render(await PublicChecksPage({ searchParams: Promise.resolve({ category: "security", page: "2" }) }));
  const security = publicChecks.filter((check) => check.area === "Security");

  expect(screen.getByText("Showing 11\u201320 of 37")).toBeInTheDocument();
  expect(container.innerHTML).toContain("Showing 11\u201320 of 37");
  expect(listLinks(container)).toEqual(security.slice(10, 20).map((check) => check.title));
  expect(listLinks(container)).not.toContain(security[0]?.title);
  expect(screen.getByRole("link", { name: "Security 37" })).toHaveAttribute("href", "/checks?category=security");
  expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/checks?category=security");
  expect(screen.getByRole("link", { name: "1" })).toHaveAttribute("href", "/checks?category=security");
  expect(screen.getByText("2", { selector: "[aria-current='page']" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "3" })).toHaveAttribute("href", "/checks?category=security&page=3");
});

it("treats a missing or unknown category as all and clamps the page", async () => {
  const { container } = render(await PublicChecksPage({ searchParams: Promise.resolve({ category: "unknown", page: "0" }) }));
  expect(screen.getByRole("link", { name: "All 48" })).toHaveAttribute("aria-current", "page");
  const security = publicChecks.filter((check) => check.area === "Security");
  expect(listLinks(container)).toEqual(security.slice(0, 10).map((check) => check.title));
  expect(listLinks(container)[4]).toBe(security[4]?.title);
  expect(listLinks(container)[4]).toBe("Public database");

  cleanup();
  render(await PublicChecksPage({ searchParams: Promise.resolve({ page: "nope" }) }));
  expect(screen.getByText("Showing 1\u201310 of 48")).toBeInTheDocument();

  cleanup();
  render(await PublicChecksPage({ searchParams: Promise.resolve({ page: "99" }) }));
  expect(screen.getByText("Showing 41\u201348 of 48")).toBeInTheDocument();
  expect(screen.getByText("5", { selector: "[aria-current='page']" })).toBeInTheDocument();
  expect(screen.getByText("Next")).toHaveAttribute("aria-disabled", "true");
});

it("still shows what a check looks for on its detail page", async () => {
  const check = publicChecks.find((item) => item.slug === "public-database");
  expect(check).toBeDefined();
  render(await PublicCheckPage({ params: Promise.resolve({ slug: "public-database" }) }));
  expect(screen.getByText(check!.looksFor)).toBeInTheDocument();
  expect(screen.getByText("When this line appears once, the review proposes this change.")).toBeInTheDocument();
  expect(screen.getByText("publicly_accessible = true becomes publicly_accessible = false")).toBeInTheDocument();
});

it("does not invent a line change for a check without an exact rule", async () => {
  const { container } = render(await PublicCheckPage({ params: Promise.resolve({ slug: "error-rate" }) }));
  expect(container.textContent).not.toContain("becomes");
  expect(screen.queryByText("When this line appears once, the review proposes this change.")).not.toBeInTheDocument();
});
