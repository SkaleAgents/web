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
  description: "AI DevOps control plane",
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
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        <footer className="border-t border-line bg-canvas-elevated">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-5 text-xs text-ink-muted">
            <span>© 2026 SkaleAgents</span>
            <span>AI DevOps control plane</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
