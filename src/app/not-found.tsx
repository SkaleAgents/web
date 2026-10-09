import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found | SkaleAgents",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <main className="max-w-3xl py-12">
    <h1 className="font-display text-4xl font-bold">Page not found</h1>
    <p className="mt-4 text-lg text-ink-muted">That page does not exist. Try the <Link className="underline underline-offset-4" href="/bot-directory">bot directory</Link>, the <Link className="underline underline-offset-4" href="/checks">review checks</Link>, or go back to the <Link className="underline underline-offset-4" href="/">home page</Link>.</p>
  </main>;
}
