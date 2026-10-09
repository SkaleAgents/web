import type { Metadata } from "next";
import { markdownPath } from "./site-url";

export const DESCRIPTION_MIN = 110;
export const DESCRIPTION_MAX = 160;

const SOCIAL_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "SkaleAgents, the control plane for AI DevOps agents" };

const DESCRIPTION_PAD = "Read it on SkaleAgents, no account required.";

/** Keeps a meta description between 110 and 160 characters, trimming at a word boundary. */
export function metaDescription(text: string, pad: string = DESCRIPTION_PAD): string {
  let out = text.replace(/\s+/g, " ").trim();
  if (out.length < DESCRIPTION_MIN) {
    out = `${out}${/[.!?]$/.test(out) ? "" : "."} ${pad}`.trim();
  }
  if (out.length > DESCRIPTION_MAX) {
    const cut = out.slice(0, DESCRIPTION_MAX - 3);
    const boundary = cut.lastIndexOf(" ");
    out = `${(boundary > DESCRIPTION_MIN ? cut.slice(0, boundary) : cut).replace(/[\s,.;:!?-]+$/, "")}...`;
  }
  return out;
}

type PageMetadataInput = {
  path: string;
  title: string;
  description: string;
  type?: "website" | "article";
  publishedTime?: string;
  markdown?: boolean;
  pad?: string;
};

/** One place for title, description, canonical, Open Graph, and Twitter tags so og:url always equals the canonical. */
export function pageMetadata({ path, title, description, type = "website", publishedTime, markdown = true, pad }: PageMetadataInput): Metadata {
  const summary = metaDescription(description, pad);
  return {
    title,
    description: summary,
    alternates: { canonical: path, ...(markdown ? { types: { "text/markdown": markdownPath(path) } } : {}) },
    openGraph: {
      type,
      siteName: "SkaleAgents",
      title,
      description: summary,
      url: path,
      images: [SOCIAL_IMAGE],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: { card: "summary_large_image", title, description: summary, images: [SOCIAL_IMAGE.url] },
  };
}
