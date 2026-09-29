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
  ["https://huzzler.so/products/hJHZDJxqO5/skaleagents?utm_source=huzzler_product_website&utm_medium=badge&utm_campaign=free_listing", "Huzzler Embed Badge"],
  ["https://turbo0.com/item/skaleagents", "Listed on Turbo0"],
  ["https://sumodir.com", "Featured on SumoDir"],
  ["https://postmake.io", "Featured on the Postmake directory"],
  ["https://ainexfinder.com", "AInexfinder AI Tools Directory"],
  ["https://nicklaunches.com/products/skaleagents/?utm_source=skaleagents.com&utm_medium=badge&utm_campaign=featured", "Featured on Nick Launches"],
  ["https://bowora.com/", null],
  ["https://navfolders.com/", "Featured on NavFolders"],
] as const;

const requestedLinks = [
  ["https://newaiforyou.com", "NewAIForYou"],
  ["https://www.launch-list.org", "Launch List"],
  ["https://www.launchboard.dev/", "LaunchBoard"],
  ["https://startupproject.org/", "Startup Project"],
] as const;

describe("FooterBadges", () => {
  it("includes each new directory link once in the initial homepage HTML", () => {
    const markup = renderToStaticMarkup(<FooterBadges />);
    const page = new DOMParser().parseFromString(markup, "text/html");
    const links = Array.from(page.querySelectorAll("a[href]"));

    for (const [href] of [...requestedBadges, ...requestedLinks]) {
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
      } else if (href === "https://bowora.com/") {
        expect(matchingLinks[0]).toHaveTextContent(/Featured on\s*Bowora/);
        expect(matchingLinks[0].querySelector("svg")).not.toBeNull();
      } else {
        expect(matchingLinks[0], href).toHaveTextContent("AI旋风");
      }
    }

    const agentHunter = links.find((link) => link.getAttribute("href") === "https://www.agenthunter.io");
    expect(agentHunter).toHaveTextContent("Featured AI Agent");
  });

  it("renders the remaining submissions as plain links outside the badge slider", () => {
    const { container } = render(<FooterBadges />);
    const allLinks = Array.from(container.querySelectorAll("a[href]"));

    for (const [href, label] of requestedLinks) {
      const matchingLinks = allLinks.filter((link) => link.getAttribute("href") === href);
      expect(matchingLinks, href).toHaveLength(1);
      expect(matchingLinks[0]).toHaveTextContent(label);
      expect(matchingLinks[0].closest(".footer-badge-group")).toBeNull();
    }
  });
});
