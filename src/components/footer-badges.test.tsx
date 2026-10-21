import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FooterBadgesFallback } from "@/components/footer-badges-fallback";
import { FooterBadges } from "./footer-badges";

const requestedBadges = [
  ["https://doforai.tools/", "Listed on doforai"],
  ["https://web-review.com", "Featured on Web Review"],
  ["https://saashunt.best/projects/skaleagents?utm_source=badge", "Featured on SaasHunt"],
  ["https://startupfa.me/s/skaleagents?utm_source=skaleagents.com", "SkaleAgents - Featured on Startup Fame"],
  ["https://www.aixuanfeng.com", null],
  ["https://startuptrusted.com?ref=skaleagents.com", "SkaleAgents on StartupTrusted"],
  ["https://neeed.directory/products/skaleagents", "Featured on neeed.directory"],
  ["https://findly.tools/", "Featured on Findly.tools"],
  ["https://tools.launchllama.co/products/skaleagents", "Featured on Launch Llama Tools"],
  ["https://www.agenthunter.io", "AgentHunter Badge"],
  ["https://twelve.tools/skaleagents", "Featured on Twelve Tools"],
  ["https://huzzler.so/products/8hF0LarShp/skaleagents-1?utm_source=huzzler_product_website&utm_medium=badge&utm_campaign=free_listing", "Huzzler Embed Badge"],
  ["https://codehype.ai/product/skaleagents?utm_source=codehype_badge", "Featured on CodeHype"],
  ["https://turbo0.com/item/skaleagents", "Listed on Turbo0"],
  ["https://sumodir.com/item/skaleagents-skaleagentscom", "Featured on SumoDir"],
  ["https://postmake.io", "Featured on the Postmake directory"],
  ["https://ainexfinder.com", "AInexfinder AI Tools Directory"],
  ["https://nicklaunches.com/", "Featured on Nick Launches"],
  ["https://bowora.com/skaleagents.com", null],
  ["https://navfolders.com/", "Featured on NavFolders"],
  ["https://www.aitoolfinder.com/", "#1 Product on www.aitoolfinder.com"],
  ["https://www.direct2app.com", "Featured On Direct2App"],
  ["https://firstlook.tools", "Featured on First Look"],
  ["https://fazier.com/launches/skaleagents.com", "Fazier badge"],
  ["https://submito.net", "Listed on Submito"],
  ["https://toolfame.com/item/skaleagents", "Featured on toolfame.com"],
  ["https://toolhunter.ai/ai-tool/skaleagents?ref=badge", "Featured on Toolhunter"],
  ["https://aifinder.site", "Discover more AI tools at aifinder.site"],
  ["https://www.productlaunchify.com/projects/skaleagents", "Featured on Product Launchify"],
  ["https://artificin.com?utm_source=badge&utm_medium=referral&utm_campaign=featured_badge", "Featured on Artificin"],
  ["https://tools.cafe", "Listed on tools.cafe"],
  ["https://xinquji.com", "Featured on Xinquji"],
  ["https://easylaunch.dev/dev-tools/skaleagents", "Featured on EasyLaunch"],
  ["https://shipgrowth.dev", "Featured on ShipGrowth"],
  ["https://aitooldiscovery.com", "Featured on AI Tool Discovery"],
  ["https://launchkiwi.com/", "Featured on LaunchKiwi"],
  ["https://toolverified.com/", "SkaleAgents on ToolVerified"],
  ["https://www.promptfrenzy.com/directory", "Featured on PromptFrenzy AI Directory"],
  ["https://mediapronet.com/?utm_source=partner-site&utm_medium=badge", "Listed on MEDIAPRONET"],
  ["https://toolnav.ai/", "ToolNav AI"],
  ["https://agentwise.org/agent/skaleagents", null],
  ["https://aigclist.com", "Featured on AIGCLIST"],
  ["https://goodsaas.xyz/saas/skaleagents", "SkaleAgents on goodSaaS"],
  ["https://toolroots.com", "Featured on ToolRoots"],
  ["https://indieascent.com/p/skaleagents", "Featured on IndieAscent"],
] as const;

const addedBadgeImages = [
  ["https://www.aitoolfinder.com/", "https://www.aitoolfinder.com//function/badge-generator.php?type=0&theme=light&domain=www.aitoolfinder.com", "84", null],
  ["https://www.direct2app.com", "https://www.direct2app.com/featured-light.svg", null, "noopener"],
  ["https://firstlook.tools", "https://firstlook.tools/badge/badge_dark.svg", "54", "noopener noreferrer"],
  ["https://submito.net", "https://submito.net/badge/listed-light.svg", null, null],
  ["https://toolfame.com/item/skaleagents", "https://toolfame.com/badge-light.svg", null, "noopener noreferrer"],
  ["https://toolhunter.ai/ai-tool/skaleagents?ref=badge", "https://toolhunter.ai/badge/skaleagents.svg?theme=light", "50", "noopener"],
  ["https://aifinder.site", "https://aifinder.site/light-badge.png", null, "noopener noreferrer"],
  ["https://www.productlaunchify.com/projects/skaleagents", "https://www.productlaunchify.com/images/badges/powered-by-light.svg", "55", "noopener noreferrer"],
  ["https://artificin.com?utm_source=badge&utm_medium=referral&utm_campaign=featured_badge", "https://artificin.com/badges/Artificin-badge.png", "50", "noopener"],
  ["https://tools.cafe", "https://tools.cafe/b/dark.svg", "54", "noopener noreferrer"],
  ["https://xinquji.com", "https://xinquji.com/badge", "54", "noopener noreferrer"],
  ["https://easylaunch.dev/dev-tools/skaleagents", "https://easylaunch.dev/badge/easylaunch-badge-light.svg", "56", "noopener"],
  ["https://shipgrowth.dev", "https://storage.shipgrowth.dev/badge-light.png", null, "noopener noreferrer"],
  ["https://aitooldiscovery.com", "https://aitooldiscovery.com/badges/featured-1.svg", "54", null],
  ["https://launchkiwi.com/", "https://launchkiwi.com/badge-light.svg", "62", "noopener"],
  ["https://toolverified.com/", "https://www.toolverified.com/badge/35703d0a1bdf0158f31b3af7-light.svg", "54", "noopener"],
  ["https://www.promptfrenzy.com/directory", "https://www.promptfrenzy.com/badges/directory.svg", "44", "noopener"],
  ["https://mediapronet.com/?utm_source=partner-site&utm_medium=badge", "https://mediapronet.com/api/badge?style=classic", "54", "nofollow noopener noreferrer"],
  ["https://toolnav.ai/", "https://toolnav.ai/badges/toolnav-dark.svg", "60", "noopener noreferrer"],
  ["https://aigclist.com", "https://aigclist.com/imgs/badge.svg", "56", "noopener"],
] as const;

const requestedLinks = [
  ["https://smolsaas.com", "Smol SaaS", ""],
  ["https://newaiforyou.com", "NewAIForYou", "noopener noreferrer"],
  ["https://startupproject.org/", "Startup Project", "noopener noreferrer"],
  ["https://www.aitoolgo.com", "AiToolGo", "noopener noreferrer"],
  ["https://right-ai.com/", "RightAI Tools Diresctory", null],
  ["https://www.aiheron.com/", "AiHeron", null],
  ["https://okeiai.com/", "Okei AI Tools", null],
  ["https://t0ai.com", "T0 AI Tools Directory", null],
] as const;

const oct12Hosts = [
  "devtool.io", "wallof.tools", "backlinkhubs.com", "launchandloop.com", "mossai.org", "launchsoar.com", "zplatform.ai", "spacerrapps.com",
  "topaitoolsreview.com", "marketingdb.live", "theaitoolsdir.com", "directorycritic.info", "ai-findr.com", "publishyoursaas.com", "tap4ai.org",
  "popwebtools.com", "spotstartups.com", "toollisted.com", "toolsify.ai", "thesaasdir.com", "launchvoid.com", "toolsclaw.com", "dofollow.tools",
  "launchnest.io", "launchpadly.co", "ainewtool.site", "saasgrow.ai", "saasaur.com", "leanvibe.io", "stackledge.com", "appstackbuilder.com",
  "indexof.ai", "alphashot.com", "prolaunch.net", "curlship.com",
];

const oct13Hosts = [
  "aiblog.tools", "aihunt.one", "aiindex.tools", "buildway.cc", "describepicture.cc", "easydofollow.dev", "elf08.com", "hotools.com", "saasdb.net",
  "saastool.site", "shareyourstartup.com", "useneedle.net", "agentwork.tools", "ai-directory.com", "aiboom.tools", "aifinderplus.com", "aitrovex.com",
  "aiwizard.ai", "backlink2web.com", "dynamite-ai.com", "freeai.run", "intelligenttools.co", "justsimple.tools",
  "launchit.fast", "letslaunch.today", "meoai.net", "microsaasexamples.com", "oranyx.ai", "productdirs.com", "saascubes.com", "sellwithboost.com",
  "stork.ai", "submitforbacklinks.com", "submitstartup.io", "submityouraitool.com", "thankjohn.com", "thedevtoolsdir.com", "toolbit.ai", "toolsapp.cc",
  "toplistly.com", "tulimoa.com", "ufind.best", "youraihunt.com",
  "yourhack.ai", "roozna.com", "superlaunchlist.com",
];

const oct15Hosts = [
  "saaslineup.com", "domainrank.app", "noonlaunch.com", "lemonlaunch.dev", "indiestore.co", "launchai.tools", "bunny.directory", "alltoolsdirectory.com",
  "tooluck.org", "aitoolslist.tools", "in-sla.org", "newwebdirectory.com", "nextlaunch.io", "launchbuck.com", "debutpin.com", "launchfinds.com",
  "startupfinds.com", "startupscrolls.com", "whatai.cc", "deepdhai.com", "navdh.com", "steeldirectory.net", "finetools.ai", "ontoplist.com",
  "smartees.tech", "themicrosaasdir.com", "aitrustlist.com", "bestsky.tools", "outdr.lol", "seektool.ai", "adsly.io", "boostdomainrating.com",
];

const oct17Hosts = [
  "directory.getseoo.com", "indielineup.com", "launchelion.com", "saasearch.io", "swipetolaunch.com", "toolquix.com",
  "bestaitool.app", "wtai.cc", "thetoolpicker.com",
];

const oct19Images = ["launchboard.dev", "justsimple.tools", "freeai.run", "thetoolpicker.com", "aicavo.com", "getlaunchpod.com", "launchpadly.co", "vibetoyou.com", "smoltop.com", "aifinderplus.com", "aitrovex.com", "directoryhunt.org", "launch-list.org", "newtools.site"];
const oct19Links = ["aihuntbase.com", "mozolist.com", "toolsnap.ai", "aiforthat.co"];

describe("FooterBadges 2026-10-19", () => {
  it("serves every badge image in the initial HTML, before the slider loads", () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<FooterBadgesFallback />), "text/html");
    const link = (host: string) => Array.from(page.querySelectorAll("a[href]")).filter((a) => new URL(a.getAttribute("href")!).hostname.replace(/^www\./, "") === host);

    for (const host of oct19Images) {
      expect(link(host), host).toHaveLength(1);
      expect(link(host)[0].querySelector("img"), host).not.toBeNull();
    }
    for (const host of oct19Links) expect(link(host), host).toHaveLength(1);
    expect(link("adsly.io")[0].querySelector("img")?.getAttribute("src")).toBe("https://adsly.io/badges/adsly-badge-dark.svg");
  });
});

describe("FooterBadges", () => {
  it("links each of the 10 directories added on 2026-10-17 exactly once", () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<FooterBadges />), "text/html");
    const hosts = Array.from(page.querySelectorAll("a[href]")).map((link) => new URL(link.getAttribute("href")!).hostname.replace(/^www\./, ""));

    for (const host of oct17Hosts) expect(hosts.filter((h) => h === host), host).toHaveLength(1);
  });

  it("links each of the 33 directories added on 2026-10-15 exactly once", () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<FooterBadges />), "text/html");
    const hosts = Array.from(page.querySelectorAll("a[href]")).map((link) => new URL(link.getAttribute("href")!).hostname.replace(/^www\./, ""));

    for (const host of oct15Hosts) expect(hosts.filter((h) => h === host), host).toHaveLength(1);
  });

  it("keeps the supplied image sources and the LaunchAI badge", () => {
    const { container } = render(<FooterBadges />);
    const primary = container.querySelector('.footer-badge-group:not([aria-hidden="true"])')!;
    const srcs = Array.from(primary.querySelectorAll("img")).map((img) => img.getAttribute("src"));

    for (const src of ["https://saaslineup.com/badge/skaleagents.svg", "https://adsly.io/badges/adsly-badge-dark.svg", "https://www.outdr.lol/badge/skaleagents.com.svg?theme=light", "https://launchai.tools/brand/launchai-rocket-mark-web.png"]) {
      expect(srcs.filter((s) => s === src), src).toHaveLength(1);
    }
    expect(primary.querySelector('a[data-launchai-badge="featured"]')).toHaveTextContent(/Featured on\s*LaunchAI/);
  });
  it("links each of the 48 directories added on 2026-10-13 exactly once", () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<FooterBadges />), "text/html");
    const hosts = Array.from(page.querySelectorAll("a[href]")).map((link) => new URL(link.getAttribute("href")!).hostname.replace(/^www\./, ""));

    for (const host of oct13Hosts) expect(hosts.filter((h) => h === host), host).toHaveLength(1);
  });

  it("links each of the 35 directories added on 2026-10-12 exactly once", () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<FooterBadges />), "text/html");
    const hosts = Array.from(page.querySelectorAll("a[href]")).map((link) => new URL(link.getAttribute("href")!).hostname.replace(/^www\./, ""));

    for (const host of oct12Hosts) expect(hosts.filter((h) => h === host), host).toHaveLength(1);
    expect(hosts.filter((h) => h === "saasgrow.app")).toHaveLength(1);
  });

  it("includes each new directory link once in the initial homepage HTML", () => {
    const markup = renderToStaticMarkup(<FooterBadges />);
    const page = new DOMParser().parseFromString(markup, "text/html");
    const links = Array.from(page.querySelectorAll("a[href]"));

    for (const [href] of [...requestedBadges, ...requestedLinks]) {
      expect(links.filter((link) => link.getAttribute("href") === href), href).toHaveLength(1);
    }

    expect(markup).not.toContain("hJHZDJxqO5");
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
      } else if (href === "https://bowora.com/skaleagents.com") {
        expect(matchingLinks[0]).toHaveTextContent(/Featured on\s*Bowora/);
        expect(matchingLinks[0].querySelector("svg")).not.toBeNull();
      } else if (href === "https://agentwise.org/agent/skaleagents") {
        expect(matchingLinks[0]).toHaveTextContent(/Featured on\s*AgentWise/);
        expect(matchingLinks[0].querySelector("svg")).toHaveAttribute("width", "200");
        expect(matchingLinks[0].querySelector("svg")).toHaveAttribute("height", "48");
        expect(matchingLinks[0]).toHaveAttribute("rel", "noopener");
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

    const toolhunter = links.find((link) => link.getAttribute("href") === "https://toolhunter.ai/ai-tool/skaleagents?ref=badge")?.querySelector("img");
    expect(toolhunter).toHaveAttribute("width", "200");
    const launchify = links.find((link) => link.getAttribute("href") === "https://www.productlaunchify.com/projects/skaleagents");
    expect(launchify).toHaveAttribute("title", "Featured on Product Launchify");
    expect(launchify).toHaveAttribute("aria-label", "Featured on Product Launchify");
    expect(launchify?.querySelector("img")).toHaveAttribute("width", "231");
    expect(links.find((link) => link.getAttribute("href") === "https://aifinder.site")?.querySelector("img")).toHaveAttribute("style", "width: 200px; height: auto;");

    const artificin = links.find((link) => link.getAttribute("href") === "https://artificin.com?utm_source=badge&utm_medium=referral&utm_campaign=featured_badge")?.querySelector("img");
    expect(artificin).toHaveAttribute("width", "175");
    expect(artificin).toHaveAttribute("height", "50");
    expect(artificin?.getAttribute("style")).toContain("width: 175px");
    expect(artificin?.getAttribute("style")).toContain("height: 50px");
    const toolsCafe = links.find((link) => link.getAttribute("href") === "https://tools.cafe")?.querySelector("img");
    expect(toolsCafe).toHaveAttribute("src", "https://tools.cafe/b/dark.svg");
    expect(toolsCafe).toHaveAttribute("width", "220");
    const xinquji = links.find((link) => link.getAttribute("href") === "https://xinquji.com");
    expect(xinquji).toHaveAttribute("title", "SkaleAgents：AI DevOps 智能体控制平面");
    expect(xinquji?.querySelector("img")).toHaveAttribute("style", "width: 200px; height: 54px;");
    expect(xinquji?.querySelector("img")).toHaveAttribute("width", "200");
    const easyLaunch = links.find((link) => link.getAttribute("href") === "https://easylaunch.dev/dev-tools/skaleagents")?.querySelector("img");
    expect(easyLaunch).toHaveAttribute("width", "188");
    expect(links.find((link) => link.getAttribute("href") === "https://shipgrowth.dev")?.querySelector("img")).toHaveAttribute("style", "height: 64px; width: auto;");
    expect(links.find((link) => link.getAttribute("href") === "https://aitooldiscovery.com")?.querySelector("img")).toHaveAttribute("width", "200");
    expect(container.innerHTML).not.toContain("https://tools.cafe/b/light.svg");
    expect(links.find((link) => link.getAttribute("href") === "https://launchkiwi.com/")?.querySelector("img")).toHaveAttribute("width", "198");
    const toolVerified = links.find((link) => link.getAttribute("href") === "https://toolverified.com/")?.querySelector("img");
    expect(toolVerified).toHaveAttribute("width", "220");
    expect(toolVerified?.getAttribute("style")).toContain("width: 220px");
    expect(toolVerified?.getAttribute("style")).toContain("height: 54px");
    const promptFrenzy = links.find((link) => link.getAttribute("href") === "https://www.promptfrenzy.com/directory");
    expect(promptFrenzy).toHaveAttribute("title", "Featured on PromptFrenzy AI Directory");
    expect(promptFrenzy?.querySelector("img")).toHaveAttribute("loading", "lazy");
    expect(promptFrenzy?.querySelector("img")).toHaveAttribute("width", "220");
    expect(links.find((link) => link.getAttribute("href") === "https://mediapronet.com/?utm_source=partner-site&utm_medium=badge")?.querySelector("img")).not.toHaveAttribute("width");
    expect(links.find((link) => link.getAttribute("href") === "https://toolnav.ai/")?.querySelector("img")).toHaveAttribute("width", "220");
    expect(links.find((link) => link.getAttribute("href") === "https://aigclist.com")?.querySelector("img")).toHaveAttribute("width", "240");
    expect(container.innerHTML).not.toContain("toolnav-light");
  });

  it("renders the remaining submissions as plain links outside the badge slider", () => {
    const { container } = render(<FooterBadges />);
    const allLinks = Array.from(container.querySelectorAll("a[href]"));

    for (const [href, label, rel] of requestedLinks) {
      const matchingLinks = allLinks.filter((link) => link.getAttribute("href") === href);
      expect(matchingLinks, href).toHaveLength(1);
      expect(matchingLinks[0]).toHaveTextContent(label);
      if (rel) expect(matchingLinks[0]).toHaveAttribute("rel", rel);
      else expect(matchingLinks[0]).not.toHaveAttribute("rel");
      expect(matchingLinks[0].closest(".footer-badge-group")).toBeNull();
      expect(matchingLinks[0].querySelector("img")).toBeNull();
    }

    expect(allLinks.find((link) => link.getAttribute("href") === "https://www.aitoolgo.com")).toHaveAttribute("title", "AiToolGo");
    expect(allLinks.find((link) => link.getAttribute("href") === "https://right-ai.com/")).toHaveAttribute("title", "RightAI Tools Directory");
    expect(allLinks.find((link) => link.getAttribute("href") === "https://www.aiheron.com/")).toHaveAttribute("title", "AiHeron AI nav");
    expect(allLinks.find((link) => link.getAttribute("href") === "https://okeiai.com/")).toHaveAttribute("title", "Okei AI Tools Directory");
    expect(allLinks.find((link) => link.getAttribute("href") === "https://t0ai.com")).toHaveAttribute("title", "T0 AI Tools Directory");
  });
});

describe("FooterBadges 2026-10-20 audit", () => {
  const added = [
    "ai-webcatalog.space", "aisuperhub.io", "aitoolist.com", "aitoolsprime.com", "aiwebsite.run", "bestekitools.com", "comparateur-ia.com", "huntstartup.com",
    "launchfederation.com", "legit.show", "megalaun.ch", "outclimbed.com", "scrappystartups.com", "superlaun.ch", "thedevtoolsindex.com", "websitelaunches.com",
  ];
  const removed = ["allstartups.info", "bestofweb.site", "hiproducty.com", "indieshowcase.io", "top4ai.com"];

  it("links the 16 added directories once and drops the 5 dead ones", () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<FooterBadges />), "text/html");
    const hosts = Array.from(page.querySelectorAll("a[href]")).map((link) => new URL(link.getAttribute("href")!).hostname.replace(/^www\./, ""));

    for (const host of added) expect(hosts.filter((h) => h === host), host).toHaveLength(1);
    for (const host of removed) expect(hosts, host).not.toContain(host);
  });
});

describe("FooterBadges 2026-10-21 audit", () => {
  const imageHosts = [
    "infrabase.ai", "indiehunt.io", "buildvoyage.com", "peerpush.com", "tinylaunch.com", "llmrelevance.com", "techtrendin.com", "nxgntools.com",
    "sideprojects.net", "liftoapp.com", "makerhunt.io", "meshkore.com", "nextbigproduct.com", "inuidea.com", "inventlist.com", "viberank.dev",
    "saashammer.net", "hicyou.com", "worthtotry.com", "aistart.ai", "domainrating.lol", "nowfound.app", "launchranked.com", "doitlaunch.com",
    "rankcert.com", "productperch.com", "saatlas.com", "launchaijam.com", "falcoscan.com", "curlship.com", "toolindex.net",
  ];
  const linkHosts = [
    "startup.sx", "strategic-flow-audit.replit.app", "thetoolsverse.com", "spotlitely.com", "vibecodinglist.com", "verifieddr.com", "aipicks.jp",
    "allmcps.com", "ki-tool24.de", "truetier.app", "olud.ai",
  ];
  const listingHrefs = [
    "https://www.superlaun.ch/products/3509", "https://prolaunch.net/projects/skaleagents", "https://smollaunch.com/products/skaleagents",
    "https://twelve.tools/skaleagents", "https://wired.business/skaleagents", "https://neeed.directory/products/skaleagents",
    "https://www.launch-list.org/product/skaleagents", "https://aifinderplus.com/item/skaleagents", "https://productfame.com/products/skaleagents",
    "https://bowora.com/skaleagents.com", "https://curlship.com/l/3742", "https://toolindex.net/tools/skaleagents",
  ];

  it("links each added directory once and each fixed listing once, with no leftover root links", () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<FooterBadges />), "text/html");
    const hrefs = Array.from(page.querySelectorAll("a[href]")).map((link) => link.getAttribute("href")!);
    const hosts = hrefs.map((href) => new URL(href).hostname.replace(/^www\./, ""));

    for (const host of [...imageHosts, ...linkHosts]) expect(hosts.filter((h) => h === host), host).toHaveLength(1);
    for (const href of listingHrefs) expect(hrefs.filter((h) => h === href), href).toHaveLength(1);
    for (const root of ["https://www.superlaun.ch", "https://prolaunch.net", "https://toolindex.net/?ref=listed", "https://curlship.com/"]) expect(hrefs, root).not.toContain(root);
  });

  it("serves the two blocked badges from our own origin and uses the right Viberank app", () => {
    const { container } = render(<FooterBadges />);
    const srcs = Array.from(container.querySelectorAll("img")).map((img) => img.getAttribute("src")!);

    expect(srcs).toContain("/badges/topaitoolsreview.svg");
    expect(srcs).toContain("/badges/shareyourstartup.svg");
    expect(srcs).not.toContain("https://cdn.topaitoolsreview.com/defaults/featured-on_light.svg");
    expect(srcs).not.toContain("https://shareyourstartup.com/badge/466.svg");
    expect(srcs).toContain("https://viberank.dev/badge?app=SkaleAgents&theme=dark");
    expect(srcs).toContain("https://dailypings.com/badge.svg");
  });
});
