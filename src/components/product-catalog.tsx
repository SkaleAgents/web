"use client";

import Image from "next/image";
import { useState } from "react";

const categories = ["All products", "Cloud & AI", "Developer tools", "Commerce", "More from us"] as const;

const products = [
  {
    name: "CloudPloy", domain: "cloudploy.com", category: "Cloud & AI", status: "Waitlist open",
    logo: "cloudploy.svg", color: "#e0f1f5", ink: "#153d4a",
    headline: "Your cloud. Your next deployment.",
    description: "Deploy to your own cloud through Claude Code, Cursor, or another MCP client. Keep deployment in the workflow you already use.",
  },
  {
    name: "Crontinel", domain: "crontinel.com", category: "Developer tools", status: "",
    logo: "crontinel.png", color: "#e6efda", ink: "#2e4524",
    headline: "Keep an eye on the work behind the scenes.",
    description: "Track scheduled jobs, queues, workers, and AI agent runs with open-source SDKs and a hosted monitoring dashboard.",
  },
  {
    name: "Toolblip", domain: "toolblip.com", category: "Developer tools", status: "",
    logo: "toolblip.svg", color: "#e4eafb", ink: "#283c75",
    headline: "Everyday tasks. A browser tab away.",
    description: "Format JSON, convert files, and work with text using free browser tools. No account needed.",
  },
  {
    name: "AmazingPlugins", domain: "amazingplugins.com", category: "Commerce", status: "",
    logo: "amazingplugins.jpg", color: "#eee5f6", ink: "#57316e",
    headline: "Small improvements for your store.",
    description: "Free WordPress and WooCommerce plugins that solve specific store problems, starting with accessibility.",
  },
  {
    name: "Appnary", domain: "appnary.com", category: "Commerce", status: "Coming soon",
    logo: "appnary.png", color: "#f7e9d7", ink: "#66451c",
    headline: "A helping hand for Shopify merchants.",
    description: "Affordable Shopify apps, including Pixel Tracker for managing Facebook, Google, TikTok, and other tracking pixels together.",
  },
  {
    name: "harun.dev", domain: "harun.dev", category: "More from us", status: "",
    logo: "harun.svg", color: "#e3ecec", ink: "#284747",
    headline: "Meet the engineer behind the products.",
    description: "Engineering notes and consulting from Harun R. Rayhan, covering software, cloud architecture, and DevOps.",
  },
];

export function ProductCatalog() {
  const [category, setCategory] = useState<string>("All products");
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const visible = products.filter((product) =>
    (category === "All products" || product.category === category) &&
    `${product.name} ${product.domain} ${product.category} ${product.headline} ${product.description}`.toLowerCase().includes(query),
  );

  return <section aria-label="Product catalog" className="mt-12">
    <div className="flex flex-wrap items-end justify-between gap-6 border-y border-line py-5">
      <div role="group" aria-label="Filter products by category" className="flex flex-wrap gap-2">
        {categories.map((item) => <button key={item} type="button" className="filter-chip" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
      </div>
      <label className="w-full text-sm text-ink-muted sm:w-56">
        Search products
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or keyword" className="mt-2 block min-h-11 w-full rounded-lg border border-line bg-canvas-elevated px-3 text-ink placeholder:text-ink-muted" />
      </label>
    </div>
    <p role="status" className="my-5 text-sm text-ink-muted">{visible.length} {visible.length === 1 ? "product" : "products"} shown</p>
    <div className="grid gap-6 md:grid-cols-2">
      {visible.map((product) => <article key={product.domain} className="overflow-hidden rounded-xl border border-line bg-canvas-elevated">
        <a href={`https://${product.domain}`} target="_blank" rel="noopener noreferrer" aria-label={`Explore ${product.name} (opens in a new tab)`} className="group flex h-full flex-col focus-visible:outline-offset-[-4px]">
          <div className="flex min-h-60 flex-col justify-between gap-8 p-7 sm:p-8" style={{ backgroundColor: product.color, color: product.ink }}>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <span>{product.category}</span>
              {product.status && <span className="rounded-full border border-current/25 px-3 py-1">{product.status}</span>}
            </div>
            <p className="max-w-sm font-display text-3xl font-semibold leading-tight tracking-tight">{product.headline}</p>
          </div>
          <div className="flex flex-1 flex-col p-7 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-2">
                <Image src={`/products/${product.logo}`} alt="" width={40} height={40} className="h-full w-full object-contain" />
              </span>
              <h2 className="font-display text-2xl font-semibold tracking-tight group-hover:underline underline-offset-4">{product.name}</h2>
            </div>
            <p className="mt-5 flex-1 leading-relaxed text-ink-muted">{product.description}</p>
            <div className="mt-7 flex items-center justify-between gap-3 border-t border-line pt-5 text-sm">
              <span className="text-ink-muted">{product.domain}</span>
              <span className="inline-flex items-center gap-2 font-semibold">Explore <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 17 17 7M7 7h10v10" /></svg></span>
            </div>
          </div>
        </a>
      </article>)}
    </div>
    {visible.length === 0 && <div className="py-16 text-center">
      <h2 className="font-display text-2xl font-semibold">No products match your search</h2>
      <p className="mt-3 text-ink-muted">Try another keyword or browse the full collection.</p>
      <button type="button" onClick={() => { setCategory("All products"); setSearch(""); }} className="mt-6 min-h-11 rounded-lg bg-accent px-5 py-2 font-semibold text-accent-fg">Reset filters</button>
    </div>}
  </section>;
}
