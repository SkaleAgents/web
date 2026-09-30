import { CONSULTANCY_BOOKING_URL } from "@/lib/consultancy-link";
import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/app-shell";
import { DeferredFooterBadges } from "@/components/deferred-footer-badges";
import { FooterBadgesFallback } from "@/components/footer-badges-fallback";
import { InvitationPublisherScript, PreferredSourceControl } from "@/components/preferred-source-control";
import { captureWorkspaceInvitationScript } from "@/lib/workspace-invitations";
import { captureEmailLinkScript } from "@/lib/email-auth";

const syne = localFont({
  src: "./fonts/Syne.woff2",
  variable: "--font-syne",
  weight: "600 700",
  display: "swap",
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

const apiOrigin = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : undefined;

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
        {apiOrigin ? <link rel="preconnect" href={apiOrigin} crossOrigin="use-credentials" /> : null}
        <script id="capture-email-link" dangerouslySetInnerHTML={{ __html: captureEmailLinkScript }} />
        <script
          id="capture-workspace-invitation"
          dangerouslySetInnerHTML={{ __html: captureWorkspaceInvitationScript }}
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
            <InvitationPublisherScript />
            <AppShell publicFooter={
              <footer className="border-t border-line bg-canvas-elevated">
                <div className="mx-auto w-full max-w-5xl px-6 py-5">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
                    <span>© 2026 SkaleAgents</span>
                    <span className="flex flex-wrap gap-4"><Link href="/products">Our products</Link><Link href="/contact">Contact</Link><a href={CONSULTANCY_BOOKING_URL} referrerPolicy="no-referrer" rel="noreferrer">Book consultancy on harun.dev</a><Link href="/terms">Terms of Service</Link><Link href="/privacy">Privacy Policy</Link></span>
                  </div>
                  <PreferredSourceControl />
                  <DeferredFooterBadges fallback={<FooterBadgesFallback />} />
                </div>
              </footer>
            }>
              {children}
            </AppShell>
          </Providers>
        </div>
      </body>
    </html>
  );
}
