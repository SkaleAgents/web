import type { Metadata } from "next";
import { IBM_Plex_Mono, Source_Sans_3, Syne } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/app-shell";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "SkaleAgents",
  description: "The control plane for AI DevOps agents, audits, and collaborative remediation.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://skaleagents.com"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "SkaleAgents",
    title: "SkaleAgents | AI DevOps control plane",
    description: "Run AI DevOps audits and review remediation with your team.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "SkaleAgents | AI DevOps control plane",
    description: "Run AI DevOps audits and review remediation with your team.",
  },
  robots: { index: true, follow: true },
};

const showDevelopmentWarning =
  process.env.NEXT_PUBLIC_SHOW_DEV_WARNING === "true";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${syne.variable} ${sourceSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <script
          async
          src="https://news.google.com/swg/js/v1/publisher.js"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-canvas text-ink">
        {showDevelopmentWarning ? (
          <div
            role="status"
            className="border-b border-line bg-accent-soft px-4 py-2 text-center text-xs font-semibold text-ink"
          >
            Development preview: SkaleAgents is still being built. Do not use it
            for production work.
          </div>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col">
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </div>
        <footer className="border-t border-line bg-canvas-elevated">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5 text-xs text-ink-muted">
            <span>© 2026 SkaleAgents</span>
            <span>AI DevOps control plane</span>
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-block align-middle">
                <a href="https://launchigniter.com/product/skaleagents?ref=badge-skaleagents" target="_blank" rel="noopener noreferrer">
                  <img src="https://launchigniter.com/api/badge/skaleagents?theme=light" alt="Featured on LaunchIgniter" width="212" height="55" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://earlyhunt.com/project/skaleagents" target="_blank" rel="noopener">
                  <img src="https://earlyhunt.com/badges/earlyhunt-badge-light.svg" alt="Featured on EarlyHunt" width="265" height="58" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://saascity.io" target="_blank" rel="noopener">
                  <img src="https://saascity.io/badges/featured-dark.svg" alt="Featured on SaaSCity" width="150" height="54" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://confettisaas.com/saas/skaleagents-com?ref=badge" target="_blank" rel="noopener" aria-label="View SkaleAgents on ConfettiSaaS">
                  <img src="https://confettisaas.com/badge-light.svg" width="250" height="54" alt="SkaleAgents on ConfettiSaaS" loading="lazy" style={{ display: "block" }} />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a data-topaitools4u-badge="verified-listing" href="https://www.topaitools4u.site" target="_blank" rel="noopener" aria-label="Listed on TopAITools4U" style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 14px", border: "1px solid #d9d9d9", borderRadius: "12px", background: "#ffffff", color: "#111111", fontFamily: "Inter,Arial,sans-serif", textDecoration: "none" }}>
                  <img src="https://www.topaitools4u.site/logo.svg" alt="TopAITools4U" width="32" height="32" style={{ display: "block", width: "32px", height: "32px", borderRadius: "9px" }} />
                  <span style={{ display: "flex", flexDirection: "column", lineHeight: "1.15" }}>
                    <span style={{ fontSize: "10px", letterSpacing: ".08em", textTransform: "uppercase", color: "#6b7280" }}>Listed on</span>
                    <span style={{ fontSize: "15px", fontWeight: 700 }}>TopAITools4U</span>
                  </span>
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://aitooltrek.com">AI Tool Trek</a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://ailaunch.space/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "inline-block" }}>
                  <img src="https://ailaunch.space/assets/badges/featured.svg" alt="Featured on AILaunchSpace" width="225" height="61" style={{ display: "block" }} />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://www.aitoolzdir.com" target="_blank">AI Toolz Dir</a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://aitoolsmarketer.com/">
                  <img src="https://aitoolsmarketer.com/badges/badge-dark.svg" alt="Featured on AI Tools for Marketers" width="150" height="50" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://aitoolfame.com/item/skaleagents" target="_blank" rel="noopener noreferrer">
                  <img src="https://aitoolfame.com/badge-light.svg" alt="Featured on aitoolfame.com" style={{ height: "54px", width: "auto" }} />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://aitop10.tools/" target="_blank">AiTop10 Tools</a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://findyouragent.ai" target="_blank" style={{ textDecoration: "none" }}>
                  <img src="https://findyouragent.ai/embed-badge-gradient.svg" alt="FindYourAgent Logo" style={{ height: "10%", width: "auto" }} />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://toolcurio.com" target="_blank" rel="dofollow">
                  <img src="https://toolcurio.com/badge-light.png" alt="Featured on Toolcurio" width="200" height="54" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://dododirectory.com" target="_blank" rel="dofollow">
                  <img src="https://dododirectory.com/badge-light.png" alt="Featured on DodoDirectory" width="200" height="54" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://www.launchvault.dev" target="_blank" title="Featured on LaunchVault">
                  <img src="https://www.launchvault.dev/images/badges/launch-vault-badge.svg" alt="Featured on LaunchVault" style={{ width: "195px", height: "auto" }} />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://launchboosts.com/project/skaleagents" target="_blank">
                  <img src="https://launchboosts.com/badges/featured-dark.svg" alt="Featured on LaunchBoosts" width="180" height="54" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://saasbison.com" target="_blank" rel="dofollow">
                  <img src="https://saasbison.com/badge.png" alt="Featured on SaaSBison" width="200" height="54" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://saasgrow.app?ref=skaleagents.com" target="_blank" rel="noopener">
                  <img src="https://saasgrow.app/api/badge?type=featured&style=light" alt="SkaleAgents on SaaSGrow" width="240" height="54" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://www.108ai.com/" target="_blank" rel="noopener">108Ai</a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://dailypings.com/p/skaleagents" target="_blank" rel="noopener" title="Featured on DailyPings">
                  <img src="https://dailypings.com/badge.svg" alt="Featured on DailyPings" width="179" height="32" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://smollaunch.com" target="_blank" rel="noopener">
                  <img src="https://smollaunch.com/badges/featured.svg" alt="SkaleAgents - Featured on Smol Launch" loading="lazy" width="250" height="60" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://fazier.com/launches/skaleagents.com" target="_blank">
                  <img src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=light" width="120" alt="Fazier badge" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://aiagentsdirectory.com/agent/skaleagents" target="_blank" rel="noopener" title="Discover SkaleAgents on AI Agents Directory">
                  <img src="https://aiagentsdirectory.com/featured-badge.svg?v=2024" alt="SkaleAgents - Featured on AI Agents Directory" width="200" height="50" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://www.seewhatnewai.com" target="_blank">[backlink description]</a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://aihustle.tools" target="_blank" rel="noopener">AI Hustle</a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://www.aitoolsaver.com" target="_blank">Featured on AiToolSaver</a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://showmebest.ai" target="_blank">
                  <img src="https://showmebest.ai/badge/feature-badge-white.webp" alt="Featured on ShowMeBestAI" width="220" height="60" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://www.launchpact.io/startups?utm_source=badge&utm_medium=embed&utm_campaign=directory-badge" target="_blank" rel="noopener noreferrer">
                  <img src="https://www.launchpact.io/badge-listed.png" alt="Listed on LaunchPact" width="180" height="60" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://dokeyai.com/" title="Dokey AI Tools Directory">DokeyAI</a>
              </span>
              <span className="inline-block align-middle">
                <a title="All The Best AI Tools" href="https://allinai.tools">All in AI Tools</a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://deeplaunch.io" target="_blank" rel="noopener noreferrer">
                  <img alt="Featured on DeepLaunch.io" width="200" height="54" src="https://deeplaunch.io/badge/badge_light.svg" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://www.verifiedtools.info/tools/skaleagents" target="_blank" rel="noopener noreferrer">
                  <img src="https://www.verifiedtools.info/badge.svg" alt="SkaleAgents on Verified Tools - AI & SaaS tools directory" width="200" height="54" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://saasfame.com/item/skaleagents" target="_blank" rel="noopener noreferrer">
                  <img src="https://saasfame.com/badge-light.svg" alt="Featured on saasfame.com" style={{ height: "54px", width: "auto" }} />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://vantaige.io/ai-tool/skaleagents?utm_source=badge&utm_medium=embed" target="_blank" rel="noopener">
                  <img src="https://vantaige.io/badges/vantaige-badge-dark.svg" alt="Featured on Vantaige.io" width="200" height="56" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://productfame.com" target="_blank" rel="noopener noreferrer">
                  <img src="https://productfame.com/badges/featured-light.svg" alt="Featured on ProductFame" width="245" height="54" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://www.toolpilot.ai" target="_blank">
                  <img src="https://www.toolpilot.ai/cdn/shop/files/f-b_20x4_crop_center.png?v=1695882701" alt="Featured on ToolPilot.ai" width="454" height="100" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://wired.business" target="_blank">
                  <img src="https://wired.business/badge0-white.svg" alt="Featured on Wired Business" width="200" height="54" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://sidehunt.io/project/skaleagents" target="_blank" rel="noopener" title="View project on Sidehunt">
                  <img src="https://sidehunt.io/badges/sidehunt-badge-light.svg" alt="Featured on Sidehunt" width="200" height="60" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://auraplusplus.com/projects/skaleagents" target="_blank" rel="noopener" title="View this project on Aura++">
                  <img src="https://auraplusplus.com/images/badges/featured-on-light.svg" alt="Featured on Aura++" width="265" height="58" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://whatsthebigdata.com/ai-tools/" target="_blank" rel="noopener" title="Whatsthebigdata AI Tools Directory">
                  <img src="https://whatsthebigdata.com/badges/featured-on-whatsthebigdata-dark.png" alt="Featured on Whatsthebigdata" width="240" style={{ maxWidth: "100%", height: "auto" }} />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://uno.directory" target="_blank" rel="noopener">
                  <img src="https://uno.directory/uno-directory.svg" alt="Listed on Uno Directory" width="120" height="30" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://mydentify.com/" aria-label="Listed on Mydentify">
                  <img src="https://mydentify.com/badges/listed-on-mydentify.svg" alt="Listed on Mydentify" width="176" height="32" />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://webspot.app" target="_blank" rel="noopener noreferrer">
                  <img src="https://webspot.app/featured-list.svg" alt="Featured on Webspot" style={{ height: "54px", width: "auto" }} />
                </a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://bestaitools.me/" title="Best AI Tools">Best AI Tools</a>
              </span>
              <span className="inline-block align-middle">
                <a href="https://tooldirs.com" target="_blank">
                  <img src="https://tooldirs.com/badge/badge_dark.svg" alt="Featured on ToolDirs.com" width="200" height="54" />
                </a>
              </span>
            </div>
          </div>
          <div className="mx-auto w-full max-w-5xl px-6 pb-5">
            <div
              className="google-add-preferred-source-btn"
              google-add-preferred-source-btn=""
            />
          </div>
        </footer>
      </body>
    </html>
  );
}
