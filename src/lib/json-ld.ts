import { SITE } from "@/lib/site-url";

const publisher = { "@type": "Organization", name: "SkaleAgents", url: SITE, logo: `${SITE}/icon.svg` };

type Page = { title: string; description: string; path: string; datePublished?: string; dateModified?: string };

export function jsonLd(data: object | object[]): string {
  const body = Array.isArray(data) ? { "@context": "https://schema.org", "@graph": data } : { "@context": "https://schema.org", ...data };
  return JSON.stringify(body).replaceAll("<", "\\u003c");
}

export function articleJsonLd(page: Page) {
  return {
    "@type": "Article",
    headline: page.title,
    description: page.description,
    url: `${SITE}${page.path}`,
    mainEntityOfPage: `${SITE}${page.path}`,
    ...(page.datePublished ? { datePublished: page.datePublished } : {}),
    ...(page.dateModified ? { dateModified: page.dateModified } : {}),
    author: publisher,
    publisher,
  };
}

// Public bots and prompts are free to read and copy, so the offer is a zero price.
export function productJsonLd(page: Page) {
  return {
    "@type": "Product",
    name: page.title,
    description: page.description,
    url: `${SITE}${page.path}`,
    brand: { "@type": "Brand", name: "SkaleAgents" },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock", url: `${SITE}${page.path}` },
  };
}

export function itemListJsonLd(items: { name: string; url: string }[]) {
  return {
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, url: item.url })),
  };
}
