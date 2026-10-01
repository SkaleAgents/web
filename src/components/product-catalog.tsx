"use client";

import Image from "next/image";
import { catalogProducts, productCategories } from "@/lib/product-catalog-data";
import { ProductCover } from "./product-cover";
import { useState } from "react";

const categories = productCategories;

const products = catalogProducts;

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
          <div className="overflow-hidden" style={{ backgroundColor: product.color, color: product.ink }}>
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-6 pt-5 text-sm">
              <span>{product.category}</span>
              {product.status && <span className="rounded-full border border-current/25 px-3 py-1">{product.status}</span>}
            </div>
            <ProductCover id={product.logo.split(".")[0]} logo={product.logo} color={product.ink} />
          </div>
          <div className="flex flex-1 flex-col p-7 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-2">
                <Image src={`/products/${product.logo}`} alt="" width={40} height={40} className="h-full w-full object-contain" />
              </span>
              <h2 className="font-display text-2xl font-semibold tracking-tight group-hover:underline underline-offset-4">{product.name}</h2>
            </div>
            <p className="mt-5 font-semibold">{product.headline}</p>
            <p className="mt-2 flex-1 leading-relaxed text-ink-muted">{product.description}</p>
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
