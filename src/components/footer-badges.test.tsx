import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FooterBadges } from "./footer-badges";

const requestedBadges = [
  ["https://doforai.tools/", "Listed on doforai"],
  ["https://web-review.com", "Featured on Web Review"],
  ["https://saashunt.best/projects/skaleagents?utm_source=badge", "Featured on SaasHunt"],
  ["https://startupfa.me/s/skaleagents?utm_source=skaleagents.com", "SkaleAgents - Featured on Startup Fame"],
  ["https://www.aixuanfeng.com", null],
  ["https://startuptrusted.com?ref=skaleagents.com", "SkaleAgents on StartupTrusted"],
  ["https://neeed.directory", "Featured on neeed.directory"],
  ["https://findly.tools/skaleagents?utm_source=skaleagents", "Featured on Findly.tools"],
  ["https://tools.launchllama.co?utm_source=badge&utm_medium=referral", "Featured on Launch Llama Tools"],
  ["https://www.agenthunter.io", "AgentHunter Badge"],
  ["https://twelve.tools", "Featured on Twelve Tools"],
] as const;

describe("FooterBadges", () => {
  it("includes each new directory link once in the initial homepage HTML", () => {
    const markup = renderToStaticMarkup(<FooterBadges />);
    const page = new DOMParser().parseFromString(markup, "text/html");
    const links = Array.from(page.querySelectorAll("a[href]"));

    for (const [href] of requestedBadges) {
      expect(links.filter((link) => link.getAttribute("href") === href), href).toHaveLength(1);
    }
  });

  it("renders each missing directory once in the primary slider group", () => {
    const { container } = render(<FooterBadges />);
    const primaryGroup = container.querySelector('.footer-badge-group:not([aria-hidden="true"])');

    expect(primaryGroup).not.toBeNull();
    expect(container.querySelectorAll(".footer-badge-group")).toHaveLength(2);
    const visualClone = container.querySelector('.footer-badge-group[aria-hidden="true"]');
    expect(visualClone).not.toBeNull();
    expect(visualClone?.querySelector("a")).toHaveAttribute("tabindex", "-1");
    const links = Array.from(primaryGroup!.querySelectorAll("a"));

    for (const [href, alt] of requestedBadges) {
      const matchingLinks = links.filter((link) => link.getAttribute("href") === href);
      expect(matchingLinks, href).toHaveLength(1);

      if (alt) {
        expect(matchingLinks[0].querySelector("img"), href).toHaveAttribute("alt", alt);
      } else {
        expect(matchingLinks[0], href).toHaveTextContent("AI旋风");
      }
    }

    const agentHunter = links.find((link) => link.getAttribute("href") === "https://www.agenthunter.io");
    expect(agentHunter).toHaveTextContent("Featured AI Agent");
  });
});
