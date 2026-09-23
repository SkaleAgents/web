"use client";

import { useState } from "react";

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

function BadgeImage({ name, src, width, height }: { name: string; src: string; width: number; height: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) return <span className="footer-badge-fallback">{name}</span>;

  // Remote directory badges include SVGs and dynamic endpoints; retain their original URLs.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={`Listed on ${name}`} width={width} height={height} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

export function FooterBadges() {
  const [paused, setPaused] = useState(false);
  const [manual, setManual] = useState(false);
  const stopped = paused || manual;

  function toggleMotion() {
    setPaused(!stopped);
    setManual(false);
  }

  return (
    <div className="min-w-0 border-t border-line py-5">
      <div className="mb-3 flex items-center justify-between gap-4 text-xs text-ink-muted">
        <p className="font-medium">Find us on</p>
        <button type="button" className="footer-motion-toggle rounded px-2 py-1 hover:bg-accent-soft hover:text-ink" onClick={toggleMotion} aria-pressed={stopped}>
          <span aria-hidden="true" className="mr-2">{stopped ? "▷" : "Ⅱ"}</span>
          {stopped ? "Resume badges" : "Pause badges"}
        </button>
      </div>
      <div className="footer-badge-slider" role="region" aria-label="Directory badges" tabIndex={0} data-paused={paused} data-manual={manual} onTouchStart={() => setManual(true)} onWheel={(event) => { if (event.deltaX !== 0) setManual(true); }}>
        <div className="footer-badge-track">
          {[false, true].map((duplicate) => (
            <div key={String(duplicate)} className="footer-badge-group" aria-hidden={duplicate ? true : undefined}>
              {directoryBadges.map(([name, href, src, width, height]) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" title={name} tabIndex={duplicate ? -1 : undefined} data-topaitools4u-badge={name === "TopAITools4U" ? "verified-listing" : undefined}>
                  <BadgeImage name={name} src={src} width={width} height={height} />
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
