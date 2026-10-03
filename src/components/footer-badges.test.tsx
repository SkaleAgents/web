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
  ["https://huzzler.so/products/8hF0LarShp/skaleagents-1?utm_source=huzzler_product_website&utm_medium=badge&utm_campaign=free_listing", "Huzzler Embed Badge"],
  ["https://codehype.ai/product/skaleagents?utm_source=codehype_badge", "Featured on CodeHype"],
  ["https://turbo0.com/item/skaleagents", "Listed on Turbo0"],
  ["https://sumodir.com", "Featured on SumoDir"],
  ["https://postmake.io", "Featured on the Postmake directory"],
  ["https://ainexfinder.com", "AInexfinder AI Tools Directory"],
  ["https://nicklaunches.com/products/skaleagents/?utm_source=skaleagents.com&utm_medium=badge&utm_campaign=featured", "Featured on Nick Launches"],
  ["https://bowora.com/", null],
  ["https://navfolders.com/", "Featured on NavFolders"],
  ["https://www.aitoolfinder.com/", "#1 Product on www.aitoolfinder.com"],
  ["https://www.direct2app.com", "Featured On Direct2App"],
  ["https://firstlook.tools", "Featured on First Look"],
  ["https://indieshowcase.io", "Featured"],
  ["https://submito.net", "Listed on Submito"],
  ["https://toolfame.com/item/skaleagents", "Featured on toolfame.com"],
] as const;

const addedBadgeImages = [
  ["https://www.aitoolfinder.com/", "https://www.aitoolfinder.com//function/badge-generator.php?type=0&theme=light&domain=www.aitoolfinder.com", "84", null],
  ["https://www.direct2app.com", "https://www.direct2app.com/featured-light.svg", null, "noopener"],
  ["https://firstlook.tools", "https://firstlook.tools/badge/badge_dark.svg", "54", "noopener noreferrer"],
  ["https://indieshowcase.io", "https://indieshowcase.io/badge/featured-light.svg", null, null],
  ["https://submito.net", "https://submito.net/badge/listed-light.svg", null, null],
  ["https://toolfame.com/item/skaleagents", "https://toolfame.com/badge-light.svg", null, "noopener noreferrer"],
] as const;

const requestedLinks = [
  ["https://newaiforyou.com", "NewAIForYou", "noopener noreferrer"],
  ["https://www.launch-list.org", "Launch List", "noopener noreferrer"],
  ["https://www.launchboard.dev/", "LaunchBoard", "noopener noreferrer"],
  ["https://startupproject.org/", "Startup Project", "noopener noreferrer"],
  ["https://directoryhunt.org", "Directory Hunt", "noopener"],
  ["https://newtools.site", "NewTools", "noopener"],
] as const;

describe("FooterBadges", () => {
  it("includes each new directory link once in the initial homepage HTML", () => {
    const markup = renderToStaticMarkup(<FooterBadges />);
    const page = new DOMParser().parseFromString(markup, "text/html");
    const links = Array.from(page.querySelectorAll("a[href]"));

    for (const [href] of [...requestedBadges, ...requestedLinks]) {
      expect(links.filter((link) => link.getAttribute("href") === href), href).toHaveLength(1);
    }

    expect(markup).not.toContain("hJHZDJxqO5");
    expect(markup).not.toContain("ainewtool.site");
    expect(links.filter((link) => link.getAttribute("href") === "https://saascity.io")).toHaveLength(1);
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

    const huzzler = links.find((link) => link.getAttribute("href")?.includes("huzzler.so"));
    expect(huzzler?.querySelector("img")).not.toHaveAttribute("loading");
    expect(huzzler?.querySelector("img")).not.toHaveAttribute("decoding");

    const codeHype = links.find((link) => link.getAttribute("href")?.includes("codehype.ai"));
    const codeHypeImage = codeHype?.querySelector("img");
    expect(codeHypeImage).toHaveAttribute("src", "https://codehype.ai/badges/skaleagents.svg?variant=find-us&v=20");
    expect(codeHypeImage).toHaveAttribute("width", "180");
    expect(codeHypeImage).toHaveAttribute("height", "65");
    expect(codeHypeImage).toHaveAttribute("loading", "lazy");
    expect(codeHypeImage).toHaveAttribute("decoding", "async");
    expect(codeHypeImage).toHaveAttribute("style", "display: inline-block; border: 0px; width: 100%; max-width: 180px; height: auto; max-height: 65px;");

    for (const [href, src, height, rel] of addedBadgeImages) {
      const badge = links.find((link) => link.getAttribute("href") === href);
      const image = badge?.querySelector("img");
      expect(image, href).toHaveAttribute("src", src);
      if (height) expect(image, href).toHaveAttribute("height", height);
      if (rel) expect(badge, href).toHaveAttribute("rel", rel);
      else expect(badge, href).not.toHaveAttribute("rel");
    }

    const firstLook = links.find((link) => link.getAttribute("href") === "https://firstlook.tools")?.querySelector("img");
    expect(firstLook).toHaveAttribute("width", "200");
    expect(links.find((link) => link.getAttribute("href") === "https://submito.net")).toHaveAttribute("title", "Listed on Submito");
    expect(links.find((link) => link.getAttribute("href") === "https://www.direct2app.com")?.querySelector("img")).toHaveAttribute("style", "height: 54px; width: auto;");
    expect(links.find((link) => link.getAttribute("href") === "https://toolfame.com/item/skaleagents")?.querySelector("img")).toHaveAttribute("style", "height: 54px; width: auto;");
  });

  it("renders the remaining submissions as plain links outside the badge slider", () => {
    const { container } = render(<FooterBadges />);
    const allLinks = Array.from(container.querySelectorAll("a[href]"));

    for (const [href, label, rel] of requestedLinks) {
      const matchingLinks = allLinks.filter((link) => link.getAttribute("href") === href);
      expect(matchingLinks, href).toHaveLength(1);
      expect(matchingLinks[0]).toHaveTextContent(label);
      expect(matchingLinks[0]).toHaveAttribute("rel", rel);
      expect(matchingLinks[0].closest(".footer-badge-group")).toBeNull();
      expect(matchingLinks[0].querySelector("img")).toBeNull();
    }
  });
});
