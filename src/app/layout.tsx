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
                <a href="https://www.topaitools4u.site" data-topaitools4u-badge="verified-listing" target="_blank" rel="noopener">Featured on TopAITools4U</a>
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
