"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const directoryBadges = [
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
  ["Fazier", "https://fazier.com/launches/skaleagents.com", "https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=light", 103, 44],
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

const directoryLinks = [
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
] as const;

type DirectoryBadgeEntry = {
  name: string;
  href: string;
  src: string | null;
  width?: number;
  height?: number;
  alt?: string;
  title?: string;
  rel?: string;
  displayWidth: number;
  variant?: "agenthunter";
};

const pendingDirectoryBadges: DirectoryBadgeEntry[] = [
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
];

const directoryBadgeEntries: DirectoryBadgeEntry[] = [
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

function BadgeImage({ name, src, width, height, alt }: { name: string; src: string | null; width?: number; height?: number; alt?: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <span className="footer-badge-fallback">{name}</span>;

  // Remote directory badges include SVGs and dynamic endpoints; retain their original URLs.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt ?? `Listed on ${name}`} width={width} height={height} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

function AgentHunterBadge() {
  const [failed, setFailed] = useState(false);

  return (
    <span style={{ display: "flex", alignItems: "center", gap: 8, boxSizing: "border-box", width: "100%", height: "100%", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", padding: "2px 6px 2px 2px", color: "#111827" }}>
      {failed ? (
        <span style={{ display: "inline-flex", flex: "0 0 34px", width: 34, height: 34, alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>AH</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="AgentHunter Badge" width={40} height={40} src="https://www.agenthunter.io/logo-light.svg" loading="lazy" decoding="async" onError={() => setFailed(true)} style={{ width: 34, height: 34, maxWidth: 34, flex: "0 0 34px", objectFit: "contain" }} />
      )}
      <span>
        <span style={{ display: "block", fontSize: 12, color: "#4b5563" }}>AgentHunter</span>
        <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#111827" }}>Featured AI Agent</span>
      </span>
    </span>
  );
}

export function FooterBadges() {
  const slider = useRef<HTMLDivElement>(null);
  const [manual, setManual] = useState(false);
  const clientReady = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!manual) return;
    const resumeOutside = (event: PointerEvent) => {
      if (!slider.current?.contains(event.target as Node)) setManual(false);
    };
    document.addEventListener("pointerdown", resumeOutside);
    return () => document.removeEventListener("pointerdown", resumeOutside);
  }, [manual]);

  return (
    <div className="min-w-0 border-t border-line py-5">
      <div className="mb-3 text-xs text-ink-muted">
        <p className="font-medium">Find us on</p>
      </div>
      <div ref={slider} className="footer-badge-slider" role="region" aria-label="Directory badges" tabIndex={0} data-manual={manual} onMouseLeave={() => setManual(false)} onTouchStart={() => setManual(true)} onWheel={(event) => { if (event.deltaX !== 0) setManual(true); }}>
        <div className="footer-badge-track" style={clientReady ? undefined : { animation: "none" }}>
          {(clientReady ? [false, true] : [false]).map((duplicate) => (
            <div key={String(duplicate)} className="footer-badge-group" aria-hidden={duplicate ? true : undefined}>
              {directoryBadgeEntries.map((badge) => (
                <a key={badge.href} href={badge.href} target="_blank" rel={badge.rel} title={badge.title} tabIndex={duplicate ? -1 : undefined} style={{ width: badge.displayWidth }} data-topaitools4u-badge={badge.name === "TopAITools4U" ? "verified-listing" : undefined}>
                  {badge.variant === "agenthunter" ? <AgentHunterBadge /> : <BadgeImage name={badge.name} src={badge.src} width={badge.width} height={badge.height} alt={badge.alt} />}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-ink-muted">
        {directoryLinks.map(([name, href]) => <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="hover:text-ink hover:underline">{name}</a>)}
      </div>
    </div>
  );
}
