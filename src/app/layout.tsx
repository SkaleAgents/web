import type { Metadata } from "next";
import { IBM_Plex_Mono, Source_Sans_3, Syne } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/app-shell";
import { FooterBadges } from "@/components/footer-badges";

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
          <div className="mx-auto w-full max-w-5xl px-6 py-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
              <span>© 2026 SkaleAgents</span>
              <span>AI DevOps control plane</span>
            </div>
            <div
              className="google-add-preferred-source-btn mb-5"
              google-add-preferred-source-btn=""
            />
            <FooterBadges />
          </div>
        </footer>
      </body>
    </html>
  );
}
