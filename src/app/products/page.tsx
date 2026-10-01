import { markdownPath } from "@/lib/ai-corpus";
import type { Metadata } from "next";
import { ProductCatalog } from "@/components/product-catalog";

const title = "Our products | SkaleAgents";
const description = "Explore more from the team behind SkaleAgents: CloudPloy, Crontinel, Toolblip, AmazingPlugins, Appnary, and harun.dev.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/products", types: { "text/markdown": markdownPath("/products") } },
  openGraph: { title, description, url: "/products", type: "website", siteName: "SkaleAgents" },
  twitter: { card: "summary", title, description },
};

export default function ProductsPage() {
  return <main className="py-8 sm:py-14">
    <div className="max-w-3xl">
      <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-tight tracking-tight">Our products</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">More from the team behind SkaleAgents. Tools for your cloud, your everyday work, and your online store.</p>
      <a href="https://binarylabssoft.com/products" target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-sm underline decoration-accent underline-offset-4">Made by Binary Labs LLC<span className="sr-only"> (opens in a new tab)</span></a>
    </div>
    <ProductCatalog />
  </main>;
}
