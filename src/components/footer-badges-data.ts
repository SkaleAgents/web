import type { CSSProperties } from "react";

export const directoryBadges = [
  ["TopAITools4U", "https://www.topaitools4u.site", "https://www.topaitools4u.site/logo.svg", 64, 64],
  ["LaunchIgniter", "https://launchigniter.com/product/skaleagents?ref=badge-skaleagents", "https://launchigniter.com/api/badge/skaleagents?theme=light", 212, 55],
  ["EarlyHunt", "https://earlyhunt.com/project/skaleagents", "https://earlyhunt.com/badges/earlyhunt-badge-light.svg", 190, 58],
  ["SaaSCity", "https://saascity.io", "https://saascity.io/badges/featured-dark.svg", 210, 80],
  ["ConfettiSaaS", "https://confettisaas.com/saas/skaleagents-com?ref=badge", "https://confettisaas.com/badge-light.svg", 250, 54],
  ["AILaunchSpace", "https://ailaunch.space/", "https://ailaunch.space/assets/badges/featured.svg", 225, 61],
  ["AI Tools for Marketers", "https://aitoolsmarketer.com/", "https://aitoolsmarketer.com/badges/badge-dark.svg", 153, 44],
  ["AIToolFame", "https://aitoolfame.com/item/skaleagents", "https://aitoolfame.com/badge-light.svg", 190, 54],
  ["FindYourAgent", "https://findyouragent.ai", "https://findyouragent.ai/embed-badge-gradient.svg", 364, 94],
  ["Toolcurio", "https://toolcurio.com", "https://toolcurio.com/badge-light.png", 400, 108],
  ["DodoDirectory", "https://dododirectory.com", "https://dododirectory.com/badge-light.png", 834, 226],
  ["LaunchVault", "https://www.launchvault.dev", "https://www.launchvault.dev/images/badges/launch-vault-badge.svg", 195, 54],
  ["LaunchBoosts", "https://launchboosts.com/project/skaleagents", "https://launchboosts.com/badges/featured-dark.svg", 180, 54],
  ["SaaSBison", "https://saasbison.com", "https://saasbison.com/badge.png", 834, 226],
  ["SaaSGrow", "https://saasgrow.app?ref=skaleagents.com", "https://saasgrow.app/api/badge?type=featured&style=light", 240, 54],
  ["DailyPings", "https://dailypings.com/p/skaleagents", "https://dailypings.com/badge.svg", 179, 32],
  ["Smol Launch", "https://smollaunch.com", "https://smollaunch.com/badges/featured.svg", 250, 60],
  ["Fazier", "https://fazier.com/launches/skaleagents", "https://fazier.com/api/v1/public/badges/embed_image.svg?launch_id=14064&badge_type=daily&theme=neutral", 255, 54],
  ["AI Agents Directory", "https://aiagentsdirectory.com/agent/skaleagents", "https://aiagentsdirectory.com/featured-badge.svg?v=2024", 200, 50],
  ["ShowMeBestAI", "https://showmebest.ai", "https://showmebest.ai/badge/feature-badge-white.webp", 2400, 600],
  ["LaunchPact", "https://www.launchpact.io/startups?utm_source=badge&utm_medium=embed&utm_campaign=directory-badge", "https://www.launchpact.io/badge-listed.png", 540, 180],
  ["DeepLaunch", "https://deeplaunch.io", "https://deeplaunch.io/badge/badge_light.svg", 153, 44],
  ["Verified Tools", "https://www.verifiedtools.info/tools/skaleagents", "https://www.verifiedtools.info/badge.svg", 200, 54],
  ["SaaSFame", "https://saasfame.com/item/skaleagents", "https://saasfame.com/badge-light.svg", 170, 54],
  ["Vantaige", "https://vantaige.io/ai-tool/skaleagents?utm_source=badge&utm_medium=embed", "https://vantaige.io/badges/vantaige-badge-dark.svg", 200, 56],
  ["ProductFame", "https://productfame.com", "https://productfame.com/badges/featured-light.svg", 195, 54],
  ["ToolPilot", "https://www.toolpilot.ai", "https://www.toolpilot.ai/cdn/shop/files/f-b.png?v=1695882701", 454, 100],
  ["Wired Business", "https://wired.business", "https://wired.business/badge0-white.svg", 200, 54],
  ["Sidehunt", "https://sidehunt.io/project/skaleagents", "https://sidehunt.io/badges/sidehunt-badge-light.svg", 200, 60],
  ["Aura++", "https://auraplusplus.com/projects/skaleagents", "https://auraplusplus.com/images/badges/featured-on-light.svg", 150, 44],
  ["Whatsthebigdata", "https://whatsthebigdata.com/ai-tools/", "https://whatsthebigdata.com/badges/featured-on-whatsthebigdata-dark.png", 1024, 331],
  ["Uno Directory", "https://uno.directory", "https://uno.directory/uno-directory.svg", 146, 44],
  ["Mydentify", "https://mydentify.com/", "https://mydentify.com/badges/listed-on-mydentify.svg", 176, 32],
  ["Webspot", "https://webspot.app", "https://webspot.app/featured-list.svg", 200, 54],
  ["ToolDirs", "https://tooldirs.com", "https://tooldirs.com/badge/badge_dark.svg", 139, 44],
] as const;

export const directoryLinks = [
  ["AI Tool Trek", "https://aitooltrek.com"],
  ["AI Toolz Dir", "https://www.aitoolzdir.com"],
  ["AiTop10 Tools", "https://aitop10.tools/"],
  ["108Ai", "https://www.108ai.com/"],
  ["See What New AI", "https://www.seewhatnewai.com"],
  ["AI Hustle", "https://aihustle.tools"],
  ["AiToolSaver", "https://www.aitoolsaver.com"],
  ["DokeyAI", "https://dokeyai.com/"],
  ["All in AI Tools", "https://allinai.tools"],
  ["Best AI Tools", "https://bestaitools.me/"],
  ["NewAIForYou", "https://newaiforyou.com"],
  ["Launch List", "https://www.launch-list.org"],
  ["LaunchBoard", "https://www.launchboard.dev/"],
  ["Startup Project", "https://startupproject.org/"],
  ["Directory Hunt", "https://directoryhunt.org", "noopener"],
  ["NewTools", "https://newtools.site", "noopener"],
  ["AiToolGo", "https://www.aitoolgo.com", "noopener noreferrer", "AiToolGo"],
] as const;

export type DirectoryBadgeEntry = {
  name: string;
  href: string;
  src: string | null;
  width?: number;
  height?: number;
  alt?: string;
  title?: string;
  rel?: string;
  displayWidth: number;
  ariaLabel?: string;
  variant?: "agenthunter" | "ainexfinder" | "bowora";
  loading?: "eager" | "lazy" | null;
  decoding?: "async" | "auto" | "sync" | null;
  imageStyle?: CSSProperties;
};

export const pendingDirectoryBadges: DirectoryBadgeEntry[] = [
  { name: "DoForAI", href: "https://doforai.tools/", src: "https://doforai.tools/badge.svg", alt: "Listed on doforai", title: "doforai", displayWidth: 136 },
  { name: "Web Review", href: "https://web-review.com", src: "https://web-review.com/badge.png", width: 200, height: 54, alt: "Featured on Web Review", rel: "dofollow", displayWidth: 153.6 },
  { name: "SaaSHunt", href: "https://saashunt.best/projects/skaleagents?utm_source=badge", src: "https://saashunt.best/images/badges/featured-on-light.svg", alt: "Featured on SaasHunt", rel: "noopener noreferrer", displayWidth: 153.6 },
  { name: "Startup Fame", href: "https://startupfa.me/s/skaleagents?utm_source=skaleagents.com", src: "https://startupfa.me/badges/featured-badge.webp", width: 171, height: 54, alt: "SkaleAgents - Featured on Startup Fame", displayWidth: 121.6 },
  { name: "AI旋风", href: "https://www.aixuanfeng.com", src: null, displayWidth: 96 },
  { name: "StartupTrusted", href: "https://startuptrusted.com?ref=skaleagents.com", src: "https://startuptrusted.com/api/badge?type=featured&style=light", width: 240, height: 54, alt: "SkaleAgents on StartupTrusted", rel: "noopener", displayWidth: 153.6 },
  { name: "Neeed", href: "https://neeed.directory", src: "https://neeed.directory/badges/neeed-badge-light.svg", width: 139, alt: "Featured on neeed.directory", rel: "noopener", displayWidth: 112 },
  { name: "Findly", href: "https://findly.tools/skaleagents?utm_source=skaleagents", src: "https://findly.tools/badges/findly-tools-badge-light.svg", width: 175, height: 55, alt: "Featured on Findly.tools", rel: "noopener noreferrer", displayWidth: 122.2 },
  { name: "Launch Llama", href: "https://tools.launchllama.co?utm_source=badge&utm_medium=referral", src: "https://tools.launchllama.co/featured-badge.png?v=2", width: 200, height: 52, alt: "Featured on Launch Llama Tools", rel: "noopener noreferrer", displayWidth: 147.7 },
  { name: "AgentHunter", href: "https://www.agenthunter.io", src: "https://www.agenthunter.io/logo-light.svg", width: 40, height: 40, alt: "AgentHunter Badge", rel: "noopener noreferrer", displayWidth: 180, variant: "agenthunter" },
  { name: "Twelve Tools", href: "https://twelve.tools", src: "https://twelve.tools/badge0-white.svg", width: 148, height: 40, alt: "Featured on Twelve Tools", displayWidth: 142.1 },
  { name: "Huzzler", href: "https://huzzler.so/products/8hF0LarShp/skaleagents-1?utm_source=huzzler_product_website&utm_medium=badge&utm_campaign=free_listing", src: "https://huzzler.so/assets/images/embeddable-badges/featured.png", width: 159, height: 55, alt: "Huzzler Embed Badge", rel: "noopener noreferrer", displayWidth: 111, loading: null, decoding: null },
  { name: "CodeHype", href: "https://codehype.ai/product/skaleagents?utm_source=codehype_badge", src: "https://codehype.ai/badges/skaleagents.svg?variant=find-us&v=20", width: 180, height: 65, alt: "Featured on CodeHype", rel: "noopener noreferrer", displayWidth: 118, loading: "lazy", decoding: "async", imageStyle: { display: "inline-block", border: 0, width: "100%", maxWidth: 180, height: "auto", maxHeight: 65 } },
  { name: "Turbo0", href: "https://turbo0.com/item/skaleagents", src: "https://img.turbo0.com/badge-listed-light.svg", alt: "Listed on Turbo0", rel: "noopener noreferrer", displayWidth: 153.6 },
  { name: "SumoDir", href: "https://sumodir.com", src: "https://sumodir.com/badge.png", width: 200, height: 54, alt: "Featured on SumoDir", rel: "noopener noreferrer", displayWidth: 142.2 },
  { name: "Postmake", href: "https://postmake.io", src: "https://postmake.io/postmake_badge_light.png", width: 240, alt: "Featured on the Postmake directory", rel: "noopener noreferrer", displayWidth: 153.6 },
  { name: "AInexfinder", href: "https://ainexfinder.com", src: "https://ainexfinder.com/brand/ainexfinder-logo-white.png", alt: "AInexfinder AI Tools Directory", title: "Featured on AInexfinder", rel: "noopener", displayWidth: 240, variant: "ainexfinder" },
  { name: "Nick Launches", href: "https://nicklaunches.com/products/skaleagents/?utm_source=skaleagents.com&utm_medium=badge&utm_campaign=featured", src: "https://nicklaunches.com/badges/featured.svg", width: 200, height: 54, alt: "Featured on Nick Launches", rel: "noopener noreferrer", ariaLabel: "SkaleAgents on Nick Launches", displayWidth: 142.2 },
  { name: "Bowora", href: "https://bowora.com/", src: null, displayWidth: 170, variant: "bowora" },
  { name: "NavFolders", href: "https://navfolders.com/", src: "https://navfolders.com/badge.png", width: 200, height: 54, alt: "Featured on NavFolders", rel: "noopener noreferrer", displayWidth: 142.2 },
  { name: "AI Tool Finder", href: "https://www.aitoolfinder.com/", src: "https://www.aitoolfinder.com//function/badge-generator.php?type=0&theme=light&domain=www.aitoolfinder.com", height: 84, alt: "#1 Product on www.aitoolfinder.com", displayWidth: 153.6 },
  { name: "Direct2App", href: "https://www.direct2app.com", src: "https://www.direct2app.com/featured-light.svg", alt: "Featured On Direct2App", rel: "noopener", displayWidth: 153.6, imageStyle: { height: "54px", width: "auto" } },
  { name: "First Look", href: "https://firstlook.tools", src: "https://firstlook.tools/badge/badge_dark.svg", width: 200, height: 54, alt: "Featured on First Look", rel: "noopener noreferrer", displayWidth: 142.2 },
  { name: "IndieShowcase", href: "https://indieshowcase.io", src: "https://indieshowcase.io/badge/featured-light.svg", alt: "Featured", displayWidth: 153.6 },
  { name: "Submito", href: "https://submito.net", src: "https://submito.net/badge/listed-light.svg", alt: "Listed on Submito", title: "Listed on Submito", displayWidth: 153.6 },
  { name: "ToolFame", href: "https://toolfame.com/item/skaleagents", src: "https://toolfame.com/badge-light.svg", alt: "Featured on toolfame.com", rel: "noopener noreferrer", displayWidth: 153.6, imageStyle: { height: "54px", width: "auto" } },
  { name: "Toolhunter", href: "https://toolhunter.ai/ai-tool/skaleagents?ref=badge", src: "https://toolhunter.ai/badge/skaleagents.svg?theme=light", width: 200, height: 50, alt: "Featured on Toolhunter", rel: "noopener", displayWidth: 153.6 },
  { name: "AI Finder", href: "https://aifinder.site", src: "https://aifinder.site/light-badge.png", alt: "Discover more AI tools at aifinder.site", rel: "noopener noreferrer", displayWidth: 153.6, imageStyle: { width: "200px", height: "auto" } },
  { name: "Product Launchify", href: "https://www.productlaunchify.com/projects/skaleagents", src: "https://www.productlaunchify.com/images/badges/powered-by-light.svg", width: 231, height: 55, alt: "Featured on Product Launchify", title: "Featured on Product Launchify", rel: "noopener noreferrer", ariaLabel: "Featured on Product Launchify", displayWidth: 153.6 },
];

export const directoryBadgeEntries: DirectoryBadgeEntry[] = [
  ...directoryBadges.map(([name, href, src, width, height]) => ({
    name,
    href,
    src,
    width,
    height,
    title: name,
    rel: "noopener noreferrer",
    displayWidth: Math.min(153.6, (width / height) * 38.4),
  })),
  ...pendingDirectoryBadges,
];
