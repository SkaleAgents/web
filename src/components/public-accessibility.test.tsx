import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FooterBadges } from "./footer-badges";

/** A screen reader's name for a link: its label, its title, its own text, an image's alt, or an SVG <title>. Drawn SVG text does not count. */
function accessibleName(link: Element): string {
  const own = link.getAttribute("aria-label") || link.getAttribute("title");
  if (own) return own.trim();
  const clone = link.cloneNode(true) as Element;
  const svgTitles = Array.from(clone.querySelectorAll("svg > title")).map((title) => title.textContent ?? "").join(" ");
  clone.querySelectorAll("svg").forEach((svg) => svg.remove());
  const alts = Array.from(clone.querySelectorAll("img")).map((img) => img.getAttribute("alt") ?? "").join(" ");
  return `${clone.textContent ?? ""} ${alts} ${svgTitles}`.trim();
}

// Found by an axe scan of the live site: two badge links had no text a screen reader could read.
describe("footer badge links", () => {
  it("each has an accessible name", () => {
    const { container } = render(<FooterBadges />);
    const links = Array.from(container.querySelectorAll('.footer-badge-group:not([aria-hidden="true"]) a'));
    const unnamed = links.filter((link) => accessibleName(link) === "").map((link) => link.getAttribute("href"));

    expect(links.length).toBeGreaterThan(20);
    expect(unnamed).toEqual([]);
  });

  it("keeps the DevTool.io badge readable (white on a dark green, not light green)", () => {
    const { container } = render(<FooterBadges />);
    const badge = Array.from(container.querySelectorAll("span")).find((span) => span.textContent === "Listed on DevTool.io") as HTMLElement | undefined;

    expect(badge?.style.background.replace(/\s/g, "")).toMatch(/^(#047857|rgb\(4,120,87\))$/i);
  });
});
