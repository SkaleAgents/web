import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import { ProductCatalog } from "@/components/product-catalog";
import { itemListJsonLd, jsonLd } from "@/lib/json-ld";
import { catalogProducts } from "@/lib/product-catalog-data";

const title = "Our products | SkaleAgents";
const description = "Explore more from the team behind SkaleAgents: CloudPloy, Crontinel, Toolblip, AmazingPlugins, Appnary, and harun.dev.";

export const metadata: Metadata = pageMetadata({ path: "/products", title, description });

export default function ProductsPage() {
  return <main className="py-8 sm:py-14">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(itemListJsonLd(catalogProducts.map((product) => ({ name: product.name, url: `https://${product.domain}` })))) }} />
    <div className="max-w-3xl">
      <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-tight tracking-tight">Our products</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">More from the team behind SkaleAgents. Tools for your cloud, your everyday work, and your online store.</p>
      <a href="https://binarylabssoft.com/products" target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-sm underline decoration-accent underline-offset-4">Made by Binary Labs LLC<span className="sr-only"> (opens in a new tab)</span></a>
    </div>
    <ProductCatalog />
  </main>;
}
